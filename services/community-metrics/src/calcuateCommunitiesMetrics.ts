import { interfaces, config, database, subgraph } from '@impactmarket/core';
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
        include: [
            {
                model: database.models.ubiCommunityContract,
                as: 'contract',
            },
        ],
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
    const communityDailyEntity =
        await subgraph.queries.community.getCommunityDailyState(
            `dayId: ${yesterdayId}`
        );

    // community monthly
    const promises = communitiesState.map(async (community) => {
        const dailyState =
            await subgraph.queries.community.getCommunityDailyState(
                `dayId_gte: ${aMonthAgoId}, community: "${community.contractAddress?.toLocaleLowerCase()}"`
            );
        const allBeneficiaries =
            await subgraph.queries.beneficiary.getAllBeneficiaries(
                community.contractAddress!
            );

        return {
            address: community.contractAddress,
            dailyState,
            allBeneficiaries,
        };
    });
    const month = await Promise.all(promises);

    const communities: ICommunityToMetrics[] = [];
    for (let index = 0; index < communitiesState.length; index++) {
        const communityMonth = month.find(
            (community) =>
                community.address === communitiesState[index].contractAddress
        );
        const communityMonthlyActivity = communityMonth?.dailyState.reduce(
            (acc, el) => {
                acc.contributors += el.contributors;
                acc.claimed += el.claimed;
                acc.contributed += el.contributed;
                return acc;
            },
            { contributors: 0, claimed: 0, contributed: 0 }
        );
        const cca = communityDailyEntity.find(
            (c) => c.contractAddress === communitiesState[index].contractAddress
        );
        communities.push({
            ...communitiesState[index],
            beneficiariesClaiming: {
                count: communityMonth?.allBeneficiaries.length || 0,
                claimed: communityMonthlyActivity?.claimed 
                    ? new BigNumber(communityMonthlyActivity.claimed)
                        .multipliedBy(10 ** 18)
                        .toString()
                    : '0'
            },
            activity: {
                ...(cca
                    ? {
                          claimed: new BigNumber(cca.claimed)
                              .multipliedBy(10 ** 18)
                              .toString(),
                          claims: cca.claims.toString(),
                          beneficiaries: cca.beneficiaries,
                          raised: new BigNumber(cca.contributed)
                              .multipliedBy(10 ** 18)
                              .toString(),
                          backers: cca.contributors.toString(),
                          volume: new BigNumber(cca.volume)
                              .multipliedBy(10 ** 18)
                              .toString(),
                          txs: cca.transactions.toString(),
                          reach: cca.reach.toString(),
                          reachOut: '0',
                      }
                    : {
                          claimed: '0',
                          claims: '0',
                          beneficiaries: 0,
                          raised: '0',
                          backers: '0',
                          volume: '0',
                          txs: '0',
                          reach: '0',
                          reachOut: '0',
                      }),
                ...{
                    monthlyBackers: communityMonthlyActivity?.contributors
                        ? communityMonthlyActivity.contributors.toString()
                        : '0',
                },
                fundingRate: communityMonth?.dailyState[0]?.fundingRate
                    ? new BigNumber(
                        communityMonth.dailyState[0].fundingRate
                    )
                        .multipliedBy(10 ** config.cUSDDecimal)
                        .toString()
                    : '0',
            },
        });
    }

    const calculateMetrics = async (communities: ICommunityToMetrics[]) => {
        const dailyStatePromises: Promise<any>[] = [];
        const dailyMetricsPromises: Promise<any>[] = [];
        communities.forEach((community) => {
            const communityMonth = month.find(
                (el) => el.address === community.contractAddress
            );

            //
            if (community.activity !== undefined) {
                dailyStatePromises.push(
                    database.models.ubiCommunityDailyState.create({
                        transactions: parseInt(community.activity.txs, 10),
                        reach: parseInt(community.activity.reach, 10),
                        reachOut: parseInt(community.activity.reachOut, 10),
                        volume: community.activity.volume,
                        backers: parseInt(community.activity.backers, 10),
                        monthlyBackers: parseInt(
                            community.activity.monthlyBackers,
                            10
                        ),
                        raised: community.activity.raised,
                        claimed: community.activity.claimed,
                        claims: parseInt(community.activity.claims, 10),
                        fundingRate: parseFloat(community.activity.fundingRate),
                        beneficiaries: community.activity.beneficiaries,
                        communityId: community.id,
                        date: yesterday,
                    })
                );
            }

            // if no activity, do not calculate
            if (
                community.contract === undefined ||
                communityMonth?.allBeneficiaries === undefined ||
                communityMonth?.allBeneficiaries.length === 0 ||
                community.beneficiariesClaiming.claimed === '0'
            ) {
                return;
            }
            let ubiRate: number = 0;
            let estimatedDuration: number = 0;

            const beneficiariesTimeToWait: number[] = [];
            const beneficiariesTimeWaited: number[] = [];

            communityMonth.allBeneficiaries.forEach((beneficiary) => {
                if (
                    beneficiary.claims < 2 ||
                    beneficiary.lastClaimAt === null ||
                    beneficiary.preLastClaimAt === null
                ) {
                    return;
                }
                // the first time you don't wait a single second, the second time, only base interval
                if (community.contract === undefined) {
                    return;
                }
                const timeToWait =
                    community.contract.baseInterval +
                    (beneficiary.claims - 2) *
                        community.contract.incrementInterval;
                const timeWaited =
                    Math.floor(
                        beneficiary.lastClaimAt - beneficiary.preLastClaimAt
                    ) - timeToWait;
                //
                beneficiariesTimeToWait.push(timeToWait);
                beneficiariesTimeWaited.push(timeWaited);
            });

            if (
                beneficiariesTimeToWait.length < 2 ||
                beneficiariesTimeWaited.length < 2
            ) {
                return;
            }

            let daysSinceStart = Math.round(
                (new Date().getTime() - new Date(community.started).getTime()) /
                    86400000
            ); // 86400000 1 days in ms
            if (daysSinceStart > 30) {
                daysSinceStart = 30;
            }

            // calculate ubiRate
            ubiRate = parseFloat(
                new BigNumber(community.beneficiariesClaiming.claimed)
                    .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
                    .dividedBy(community.beneficiariesClaiming.count)
                    .dividedBy(daysSinceStart)
                    .toFixed(2, 1)
            );

            // calculate estimatedDuration
            estimatedDuration = parseFloat(
                new BigNumber(community.contract.maxClaim)
                    .dividedBy(ubiRate)
                    .dividedBy(30)
                    .toFixed(2, 1)
            );
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
        await calculateMetrics(communities.slice(i, i + batch));
        if (i + batch > communities.length) {
            break;
        }
    }
}
