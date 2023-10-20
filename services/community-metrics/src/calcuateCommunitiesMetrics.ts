import { Op, literal } from 'sequelize';
import { config, database, interfaces, services, subgraph, utils } from '@impactmarket/core';
import { getAddress } from '@ethersproject/address';
import BigNumber from 'bignumber.js';

const communitiesMap: Map<string, string[]> = new Map([]);

export async function calcuateCommunitiesMetrics(): Promise<void> {
    try {
        utils.Logger.info('Updating community metrics...');
        await communitiesMetrics();
        utils.Logger.info('Updated community metrics!');
    } catch (error) {
        utils.slack.sendSlackMessage('🚨 Error to calculate communities metrics', config.slack.lambdaChannel);
        utils.Logger.error('Error calcuateCommunitiesMetrics: ', error);
    }
}
async function communitiesMetrics(): Promise<void> {
    const aMonthAgo = new Date();
    aMonthAgo.setDate(aMonthAgo.getDate() - 30);
    aMonthAgo.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // query communities data
    const whereCommunity = {
        [Op.or]: [
            {
                status: 'valid'
            },
            {
                [Op.and]: [{ status: 'removed' }, { deletedAt: { [Op.between]: [yesterday, today] } }]
            }
        ]
    };

    const communitiesStatePre = await database.models.community.findAll({
        attributes: ['id', 'started', 'contractAddress'],
        where: {
            ...whereCommunity,
            visibility: 'public'
        },
        order: [['id', 'DESC']]
    });

    // build communities object
    const communitiesState = communitiesStatePre.map(c => c.toJSON() as interfaces.ubi.community.CommunityAttributes);

    const aMonthAgoId = (aMonthAgo.getTime() / 1000 / 86400) | 0;

    const calculateMetrics = async (communities: interfaces.ubi.community.CommunityAttributes[]) => {
        const communityEntity = await subgraph.queries.community.getCommunityStateByAddresses(
            communities.map(el => el.contractAddress!)
        );

        // community monthly
        const promises = communities.map(async community => {
            const dailyState = await subgraph.queries.community.getCommunityDailyState(
                `dayId_gte: ${aMonthAgoId}, community: "${community.contractAddress!.toLowerCase()}"`
            );
            const allBeneficiaries = await database.models.subgraphUBIBeneficiary.findAll({
                attributes: ['userAddress'],
                where: {
                    communityAddress: community.contractAddress!
                }
            })

            if (allBeneficiaries.length)
                communitiesMap.set(
                    community.contractAddress!,
                    allBeneficiaries.map(beneficiary => beneficiary.userAddress)
                );

            return {
                address: community.contractAddress,
                dailyState,
                allBeneficiaries
            };
        });

        const result = await Promise.all(promises);
        const dailyMetricsPromises: Promise<any>[] = [];
        communities.forEach(community => {
            const communityMonth = result.find(el => el.address === community.contractAddress);
            const communityContract = communityEntity.find(el => getAddress(el.id) === community.contractAddress);

            let ubiRate: number = 0;
            let estimatedDuration: number = 0;
            let daysSinceStart = Math.round((new Date().getTime() - new Date(community.started).getTime()) / 86400000); // 86400000 1 days in ms
            if (daysSinceStart > 30) {
                daysSinceStart = 30;
            }

            // calculate ubiRate
            const communityMonthReduced = communityMonth?.dailyState.reduce(
                (acc, el) => {
                    acc.claimed += el.claimed;
                    return acc;
                },
                { claimed: 0 }
            );
            ubiRate =
                communityMonthReduced?.claimed && communityMonth?.allBeneficiaries.length
                    ? parseFloat(
                          new BigNumber(communityMonthReduced.claimed)
                              .dividedBy(communityMonth.allBeneficiaries.length)
                              .dividedBy(daysSinceStart)
                              .toFixed(4, 1)
                      )
                    : 0;

            // calculate estimatedDuration
            estimatedDuration =
                communityContract?.maxClaim && ubiRate
                    ? parseFloat(
                          new BigNumber(communityContract?.maxClaim).dividedBy(ubiRate).dividedBy(30).toFixed(4, 1)
                      )
                    : 0;
            dailyMetricsPromises.push(
                database.models.ubiCommunityDailyMetrics.create({
                    communityId: community.id,
                    ssiDayAlone: 0,
                    ssi: 0,
                    ubiRate,
                    estimatedDuration,
                    date: yesterday
                })
            );
        });

        await Promise.all(dailyMetricsPromises);
    };

    const batch = config.cronJobBatchSize;
    // for each community
    for (let i = 0; ; i += batch) {
        await calculateMetrics(communitiesState.slice(i, i + batch));
        if (i + batch > communitiesState.length) {
            break;
        }
    }
}

export async function calculateGlobalDemographics() {
    try {
        utils.Logger.info('Updating global demographics...');
        const globalDemographicsService = new services.global.GlobalDemographicsService();
        
        await globalDemographicsService.calculate();
        utils.Logger.info('Updated global demographics!');
    } catch (error) {
        utils.slack.sendSlackMessage('🚨 Error to calculate global demographics', config.slack.lambdaChannel);
        utils.Logger.error('Error calculateGlobalDemographics: ', error);
    }
}

export async function calcuateCommunitiesDemographics() {
    try {
        utils.Logger.info('Updating community demographics...');
        await communitiesDemographics();
        utils.Logger.info('Updated community demographics!');
    } catch (error) {
        utils.slack.sendSlackMessage('🚨 Error to calculate community demographics', config.slack.lambdaChannel);
        utils.Logger.error('Error calcuateCommunitiesDemographics: ', error);
    }
}
async function communitiesDemographics() {
    const yesterdayDateOnly = new Date();
    yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);
    const yesterdayDate = yesterdayDateOnly.toISOString().split('T')[0];

    // get community IDs
    const keys = Array.from(communitiesMap.keys());
    const communities = await database.models.community.findAll({
        attributes: ['id', 'contractAddress'],
        where: {
            contractAddress: {
                [Op.in]: keys.map(el => getAddress(el))
            }
        }
    });

    const year = new Date().getUTCFullYear();
    const batch = config.cronJobBatchSize;
    for (let i = 0; ; i += batch) {
        const arrayTmp = Array.from(communitiesMap).slice(i, i + batch);

        // for each community
        const promises = arrayTmp.map(async el => {
            const users = await database.models.appUser.findOne({
                attributes: [
                    [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 18 AND 24)`), 'ageRange1'],
                    [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 25 AND 34)`), 'ageRange2'],
                    [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 35 AND 44)`), 'ageRange3'],
                    [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 45 AND 54)`), 'ageRange4'],
                    [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 55 AND 64)`), 'ageRange5'],
                    [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 65 AND 120)`), 'ageRange6'],
                    [literal("count(*) FILTER (WHERE gender = 'm')"), 'male'],
                    [literal("count(*) FILTER (WHERE gender = 'f')"), 'female'],
                    [literal("count(*) FILTER (WHERE gender = 'u'  OR gender is null)"), 'undisclosed'],
                    [literal('count(*)'), 'totalGender']
                ],
                where: {
                    address: {
                        [Op.in]: el[1].map(address => getAddress(address))
                    }
                }
            });

            const community = communities.find(
                community => community.contractAddress?.toLowerCase() === el[0].toLowerCase()
            );

            await database.models.ubiCommunityDemographics.create({
                communityId: community!.id,
                date: yesterdayDate,
                ...(users?.toJSON() as any)
            });
        });

        await Promise.all(promises);

        if (i + batch > communitiesMap.size) {
            break;
        }
    }

    communitiesMap.clear();
}
