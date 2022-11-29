import { interfaces, config, database, subgraph } from '@impactmarket/core';
import { CommunityAttributes } from '@impactmarket/core/src/interfaces/ubi/community';
import BigNumber from 'bignumber.js';
import { Op } from 'sequelize';

export async function calcuateCommunitiesMetrics(): Promise<void> {
    type ICommunityToMetrics = Omit<
        interfaces.ubi.community.CommunityAttributes,
        'beneficiaries'
    > & {
        beneficiariesClaiming: { count: number; claimed: string };
        activity: {
            claimed: string;
            claims: string;
            raised: string;
            backers: string;
            monthlyBackers: string;
            volume: string;
            txs: string;
            reach: string;
            reachOut: string;
            fundingRate: string;
            beneficiaries: number;
        };
    };

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
                status: 'valid',
            },
            {
                [Op.and]: [
                    { status: 'removed' },
                    { deletedAt: { [Op.between]: [yesterday, today] } },
                ],
            },
        ],
    };

    const communitiesStatePre = await database.models.community.findAll({
        attributes: ['id', 'started', 'contractAddress'],
        where: {
            ...whereCommunity,
            visibility: 'public',
        },
        order: [['id', 'DESC']],
    });

    // build communities object
    const communitiesState = communitiesStatePre.map(
        (c) => c.toJSON() as interfaces.ubi.community.CommunityAttributes
    );

    const aMonthAgoId = (aMonthAgo.getTime() / 1000 / 86400) | 0;

    // community activity: claims and claimed between yesterday and today
    const yesterdayId = (yesterday.getTime() / 1000 / 86400) | 0;

    const calculateMetrics = async (communities: CommunityAttributes[]) => {
        const communityDailyEntity =
            await subgraph.queries.community.getCommunityDailyState(
                `dayId: ${yesterdayId}, community_in: ${communities}`
            );
        const communityEntity =
            await subgraph.queries.community.getCommunityStateByAddresses(communities.map(el => el.contractAddress!));

        // community monthly
        const promises = communities.map(async (community) => {
            const dailyState =
                await subgraph.queries.community.getCommunityDailyState(
                    `dayId_gte: ${aMonthAgoId}, community: "${community.contractAddress!.toLowerCase()}"`
                );
            const allBeneficiaries =
                await subgraph.queries.beneficiary.getAllBeneficiaries(
                    community.contractAddress!
                );

            return {
                address: community,
                dailyState,
                allBeneficiaries,
            };
        });

        const month = await Promise.all(promises);
        const dailyStatePromises: Promise<any>[] = [];
        const dailyMetricsPromises: Promise<any>[] = [];
        communities.forEach((community) => {
            const communityMonth = month.find(
                (el) => el.address === community
            );
            const communityYesterday = communityDailyEntity.find(
                (el) => el.community === community.contractAddress!
            );
            const communityContract = communityEntity.find(
                (el) => el.id === community.contractAddress!
            );

            dailyStatePromises.push(
                database.models.ubiCommunityDailyState.create({
                    transactions: communityYesterday?.transactions || 0,
                    reach: communityYesterday?.reach || 0,
                    reachOut: 0,
                    volume: communityYesterday?.volume || '0', // TODO: convert to BigNumber
                    backers: communityYesterday?.contributors || 0,
                    monthlyBackers: 0,
                    raised: communityYesterday?.contributed 
                        ? new BigNumber(communityYesterday.contributed)
                            .multipliedBy(10 ** 18)
                            .toString()
                        : '0', // TODO: convert to BigNumber
                    claimed: communityYesterday?.claimed
                        ? new BigNumber(communityYesterday.claimed)
                            .multipliedBy(10 ** 18)
                            .toString()
                        : '0',
                    claims: communityYesterday?.claims || 0,
                    fundingRate: communityYesterday?.fundingRate
                        ? new BigNumber(communityYesterday.fundingRate)
                            .multipliedBy(10 ** 18)
                            .toNumber()
                        : 0,
                    beneficiaries: communityYesterday?.beneficiaries || 0,
                    communityId: community.id,
                    date: yesterday,
                })
            );

            let ubiRate: number = 0;
            let estimatedDuration: number = 0;
            let daysSinceStart = Math.round(
                (new Date().getTime() - new Date(community.started).getTime()) /
                    86400000
            ); // 86400000 1 days in ms
            if (daysSinceStart > 30) {
                daysSinceStart = 30;
            }

            // calculate ubiRate
            const communityMonthlyActivity = communityMonth?.dailyState.reduce(
                (acc, el) => {
                    acc.claimed += el.claimed;
                    return acc;
                },
                { claimed: 0 }
            );
            ubiRate = parseFloat(
                new BigNumber(communityMonthlyActivity?.claimed
                                    ? new BigNumber(communityMonthlyActivity.claimed)
                                          .multipliedBy(10 ** 18)
                                          .toString()
                                    : '0')
                    .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
                    .dividedBy(communityMonth?.allBeneficiaries.length || 0)
                    .dividedBy(daysSinceStart)
                    .toFixed(2, 1)
            );

            // calculate estimatedDuration
            estimatedDuration = communityContract?.maxClaim
                ? parseFloat(
                    new BigNumber(communityContract?.maxClaim)
                        .dividedBy(ubiRate)
                        .dividedBy(30)
                        .toFixed(2, 1)
                )
                : 0;
            dailyMetricsPromises.push(
                database.models.ubiCommunityDailyMetrics.create({
                    communityId: community.id,
                    ssiDayAlone: 0,
                    ssi: 0,
                    ubiRate,
                    estimatedDuration,
                    date: yesterday,
                })
            );
        });

        await Promise.all(dailyStatePromises);
        await Promise.all(dailyMetricsPromises);
    };

    const pending: Promise<void>[] = [];
    const batch = 20;
    // for each community
    for (let i = 0; ; i = i + batch) {
        await calculateMetrics(communitiesState.slice(i, i + batch));
        if (i + batch > communitiesState.length) {
            break;
        }
    }
}
