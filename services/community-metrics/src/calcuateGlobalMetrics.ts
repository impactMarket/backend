import { Op, col, fn, literal } from 'sequelize';
import {
    config,
    database,
    services,
    subgraph,
    utils,
} from '@impactmarket/core';
import BigNumber from 'bignumber.js';

export async function calcuateGlobalMetrics(): Promise<void> {
    try {
        utils.Logger.info('Updating global metrics...');
        await globalMetrics();
        utils.Logger.info('Updated global metrics!');
    } catch (error) {
        utils.slack.sendSlackMessage('🚨 Error to calculate global metrics', config.slack.lambdaChannel);
        utils.Logger.error('Error calcuateGlobalMetrics: ', error);
    }
}
async function globalMetrics(): Promise<void> {
    const globalDailyStateService =
        new services.global.GlobalDailyStateService();
    const todayMidnightTime = new Date();
    todayMidnightTime.setUTCHours(0, 0, 0, 0);
    const yesterdayDateOnly = new Date(); // yesterdayDateOnly
    yesterdayDateOnly.setUTCHours(0, 0, 0, 0);
    yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);

    // get last global metrics
    // TODO: maybe we need to export interfaces
    let lastGlobalMetrics: any;
    const last = await database.models.globalDailyState.findAll({
        order: [['date', 'DESC']],
        limit: 1,
        raw: true,
    });
    if (last.length === 0) {
        const startDayId =
            (((yesterdayDateOnly.getTime() / 1000) | 0) / 86400) | 0;
        const ubiDailyEntity = await subgraph.queries.ubi.getUbiDailyEntity(
            `id: ${startDayId}`
        );

        const totalActivity = {
            volume:
                ubiDailyEntity[0].volume === null
                    ? '0'
                    : ubiDailyEntity[0].volume,
            transactions: ubiDailyEntity[0].transactions,
        };

        lastGlobalMetrics = {
            avgComulativeUbi: '0',
            avgMedianSSI: 0,
            avgUbiDuration: 0,
            backers: 0,
            beneficiaries: 0,
            claimed: '0',
            claims: 0,
            fundingRate: 0,
            givingRate: 0,
            raised: '0',
            reach: 0,
            reachOut: 0,
            spendingRate: 0,
            totalBackers: 0,
            totalBeneficiaries: ubiDailyEntity[0].beneficiaries,
            totalDistributed: new BigNumber(ubiDailyEntity[0].claimed)
                .multipliedBy(10 ** 18)
                .toString(),
            totalRaised: '0',
            totalReach: BigInt(0),
            totalReachOut: BigInt(0),
            totalTransactions: BigInt(totalActivity.transactions),
            totalVolume: totalActivity.volume,
            transactions: 0,
            ubiRate: 0,
            volume: '0',
            date: new Date(),
        };
    } else {
        lastGlobalMetrics = last[0];
    }

    // ubi pulse
    const {
        givingRate,
        ubiRate,
        avgComulativeUbi,
        avgUbiDuration,
        backersAndFunding,
    } = await calculateUbiPulse(todayMidnightTime, yesterdayDateOnly);

    // economic activity
    const {
        totalVolume,
        totalTransactions,
        spendingRate,
        volume,
        transactions,
        reach,
        reachOut,
    } = await calculateEconomicActivity(yesterdayDateOnly, lastGlobalMetrics);

    // calculate charts data
    const { fundingRate, allReachEver, avgMedianSSI } =
        await calculateChartsData(
            // todayMidnightTime,
            // communitiesAvgYesterday,
            yesterdayDateOnly,
            lastGlobalMetrics
        );

    // register new global daily state
    try {
        await globalDailyStateService.add({
            date: yesterdayDateOnly,
            avgMedianSSI: Math.round(avgMedianSSI * 100) / 100,
            claimed: '0',
            claims: 0,
            beneficiaries: 0,
            raised: '0',
            backers: backersAndFunding.backers,
            volume,
            transactions,
            reach,
            reachOut,
            totalRaised: '0',
            totalDistributed: '0',
            totalBackers: 0,
            totalBeneficiaries: 0,
            givingRate,
            ubiRate: parseFloat(ubiRate.toFixed(3)),
            fundingRate: parseFloat(fundingRate),
            spendingRate,
            avgComulativeUbi,
            avgUbiDuration: Math.round(avgUbiDuration * 100) / 100,
            totalVolume,
            totalTransactions: BigInt(totalTransactions),
            totalReach: BigInt(allReachEver),
            totalReachOut: BigInt(0),
        });
    } catch (error) {
        utils.Logger.error('Calculate Global Metrics Failed: ', error);
    }

    if ((await globalDailyStateService.count()) > 60) {
        // calculate global growth
        await calculateMetricsGrowth(globalDailyStateService);
    }
}

async function calculateUbiPulse(
    todayMidnightTime: Date,
    yesterdayDateOnly: Date
) {
    const uniqueBackersAndFundingLast30Days = async (
        startDate: Date
    ): Promise<{
        backers: number;
        funding: string;
    }> => {
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date(startDate);
        aMonthAgo.setDate(startDate.getDate() - 30);
        const aMonthAgoId = (((aMonthAgo.getTime() / 1000) | 0) / 86400) | 0;
        const startDateId = (((startDate.getTime() / 1000) | 0) / 86400) | 0;

        const ubiDaily = await subgraph.queries.ubi.getUbiDailyEntity(
            `id_gte: ${aMonthAgoId}, id_lt: ${startDateId}`
        );
        const result = ubiDaily.reduce(
            (acc, el) => {
                acc.backers += el.contributors;
                acc.funding += Number(el.contributed);
                return acc;
            },
            { backers: 0, funding: 0 }
        );

        return {
            backers: result.backers,
            funding: new BigNumber(result.funding)
                .multipliedBy(10 ** config.cUSDDecimal)
                .toString(),
        };
    };

    const getCommunitiesAvg = async (
        date: Date
    ): Promise<{
        medianSSI: number;
        avgUbiRate: number;
        avgEstimatedDuration: number;
    }> => {
        const fiveDaysAgo = new Date(date);
        fiveDaysAgo.setDate(date.getDate() - 5);
        const { lte } = Op;
        const communitiesId = (
            await database.models.community.findAll({
                attributes: ['id'],
                where: {
                    visibility: 'public',
                    status: 'valid',
                    started: {
                        [lte]: fiveDaysAgo,
                    },
                },
                raw: true,
            })
        ).map((c) => c.id);

        if (communitiesId.length === 0) {
            return {
                avgEstimatedDuration: 0,
                avgUbiRate: 0,
                medianSSI: 0,
            };
        }

        const raw = (
            await database.models.ubiCommunityDailyMetrics.findAll({
                attributes: [
                    [fn('avg', col('ubiRate')), 'avgUbiRate'],
                    [
                        literal('AVG(CASE WHEN "estimatedDuration" < 10e5 THEN "estimatedDuration" ELSE NULL END)'),  // ignore outliers
                        'avgEstimatedDuration'
                    ],
                ],
                where: {
                    date,
                    communityId: { [Op.in]: communitiesId },
                } as any,
                // TODO: this Op.in is giving types errors
                raw: true,
            })
        )[0] as any;
        return {
            medianSSI: 0,
            avgUbiRate: parseFloat(raw.avgUbiRate),
            avgEstimatedDuration: parseFloat(raw.avgEstimatedDuration),
        };
    };

    const getAvgComulativeUbi = async (): Promise<string> => {
        const communityFoundingRate =
            await subgraph.queries.community.communityEntities(
                `where: { state_not: 2, maxClaim_lt: 5000 }, first: 1000`,
                `maxClaim`
            );
        const comulativeUbi = communityFoundingRate.reduce(
            (acc: number, el) => {
                acc += Number(el.maxClaim);
                return acc;
            },
            0
        );
        return new BigNumber(comulativeUbi / communityFoundingRate.length)
            .multipliedBy(10 ** config.cUSDDecimal)
            .toString(); // convert to 18 decimals before return
    };

    const backersAndFunding = await uniqueBackersAndFundingLast30Days(
        todayMidnightTime
    );
    const communitiesAvgYesterday = await getCommunitiesAvg(yesterdayDateOnly);

    const givingRate = parseFloat(
        new BigNumber(backersAndFunding.funding)
            .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
            .dividedBy(backersAndFunding.backers)
            .dividedBy(30)
            .decimalPlaces(2, 1)
            .toString()
    );
    const ubiRate = communitiesAvgYesterday.avgUbiRate;
    const avgComulativeUbi = await getAvgComulativeUbi();
    const avgUbiDuration = communitiesAvgYesterday.avgEstimatedDuration;

    return {
        givingRate,
        ubiRate,
        avgComulativeUbi,
        avgUbiDuration,
        backersAndFunding,
        communitiesAvgYesterday,
    };
}

async function calculateEconomicActivity(
    yesterdayDateOnly: Date,
    // TODO: maybe we need to export interfaces
    lastGlobalMetrics: any
) {
    let totalVolume = '0';
    let totalTransactions = '0';

    const getAllByDay = async (
        date: Date
    ): Promise<{
        reach: number;
        reachOut: number;
        volume: string;
        transactions: number;
    }> => {
        const dayId = (((date.getTime() / 1000) | 0) / 86400) | 0;
        const ubiDaily = await subgraph.queries.ubi.getUbiDailyEntity(
            `id: ${dayId}`
        );
        return {
            reach: ubiDaily[0].reach || 0,
            reachOut: 0,
            volume: ubiDaily[0].volume
                ? new BigNumber(ubiDaily[0].volume)
                      .multipliedBy(10 ** 18)
                      .toString()
                : '0',
            transactions: ubiDaily[0].transactions || 0,
        };
    };

    const volumeTransactionsAndAddresses = await getAllByDay(yesterdayDateOnly);

    const { volume, transactions } = volumeTransactionsAndAddresses;
    const reach = volumeTransactionsAndAddresses.reach;
    const reachOut = volumeTransactionsAndAddresses.reachOut;
    const spendingRate = 0;

    totalVolume = new BigNumber(lastGlobalMetrics.totalVolume)
        .plus(volumeTransactionsAndAddresses.volume)
        .toString();
    totalTransactions = new BigNumber(
        lastGlobalMetrics.totalTransactions.toString()
    )
        .plus(volumeTransactionsAndAddresses.transactions)
        .toString();

    return {
        totalVolume,
        totalTransactions,
        spendingRate,
        volume,
        transactions,
        reach,
        reachOut,
    };
}

async function calculateChartsData(
    yesterdayDateOnly: Date,
    // TODO: maybe we need to export interfaces
    lastGlobalMetrics: any
) {
    const yesterdayId =
        (((yesterdayDateOnly.getTime() / 1000) | 0) / 86400) | 0;
    const yesterdayUbi = await subgraph.queries.ubi.getUbiDailyEntity(
        `id: ${yesterdayId}`
    );

    const fundingRate = parseFloat(yesterdayUbi[0].fundingRate).toFixed(2);

    return {
        fundingRate,
        allReachEver:
            BigInt(lastGlobalMetrics.totalReach.valueOf()) +
            BigInt(yesterdayUbi[0].reach || 0),
        avgMedianSSI: 0,
    };
}

async function calculateMetricsGrowth(
    globalDailyStateService: services.global.GlobalDailyStateService
) {
    try {
        const globalGrowthService = new services.global.GlobalGrowthService();

        const todayMidnightTime = new Date();
        todayMidnightTime.setUTCHours(0, 0, 0, 0);
        const yesterdayDateOnly = new Date();
        yesterdayDateOnly.setUTCHours(0, 0, 0, 0);
        yesterdayDateOnly.setDate(todayMidnightTime.getDate() - 1);
        const aMonthAgo = new Date();
        aMonthAgo.setUTCHours(0, 0, 0, 0);
        aMonthAgo.setDate(yesterdayDateOnly.getDate() - 30);

        const present = await globalDailyStateService.sumLast30Days(
            yesterdayDateOnly
        );
        const past = await globalDailyStateService.sumLast30Days(aMonthAgo);

        const growthToAdd = {
            date: yesterdayDateOnly,
            claimed: utils.util.calculateGrowth(
                past.tClaimed,
                present.tClaimed
            ),
            claims: utils.util.calculateGrowth(past.tClaims, present.tClaims),
            beneficiaries: utils.util.calculateGrowth(
                past.tBeneficiaries,
                present.tBeneficiaries
            ),
            raised: utils.util.calculateGrowth(past.tRaised, present.tRaised),
            backers: utils.util.calculateGrowth(
                past.tBackers,
                present.tBackers
            ),
            fundingRate: utils.util.calculateGrowth(
                past.fundingRate,
                present.fundingRate
            ),
            volume: utils.util.calculateGrowth(past.tVolume, present.tVolume),
            transactions: utils.util.calculateGrowth(
                past.tTransactions,
                present.tTransactions
            ),
            reach: utils.util.calculateGrowth(past.tReach, present.tReach),
            reachOut: 0,
        };
        await globalGrowthService.add(growthToAdd);
    } catch (error) {
        utils.Logger.error('Calculate Metrics Growth Failed: ', error);
    }
}
