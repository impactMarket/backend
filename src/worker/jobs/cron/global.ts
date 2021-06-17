import { GlobalDailyStateCreationAttributes } from '@models/global/globalDailyState';
import GlobalDailyStateService from '@services/global/globalDailyState';
import GlobalGrowthService from '@services/global/globalGrowth';
import ReachedAddressService from '@services/reachedAddress';
// import BeneficiaryTransactionService from '@services/ubi/beneficiaryTransaction';
import ClaimService from '@services/ubi/claim';
import CommunityContractService from '@services/ubi/communityContract';
import CommunityDailyMetricsService from '@services/ubi/communityDailyMetrics';
// import CommunityDailyStateService from '@services/ubi/communityDailyState';
import InflowService from '@services/ubi/inflow';
// import { Logger } from '@utils/logger';
import { calculateGrowth } from '@utils/util';
import { BigNumber } from 'bignumber.js';
import { mean } from 'mathjs';
import { col, fn, Op, QueryTypes, Sequelize } from 'sequelize';

import config from '../../../config';
import { models, sequelize } from '../../../database';

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

async function calculateMetricsGrowth(
    globalDailyStateService: GlobalDailyStateService
) {
    const globalGrowthService = new GlobalGrowthService();

    const todayMidnightTime = new Date();
    todayMidnightTime.setHours(0, 0, 0, 0);
    const yesterdayDateOnly = new Date();
    yesterdayDateOnly.setHours(0, 0, 0, 0);
    yesterdayDateOnly.setDate(todayMidnightTime.getDate() - 1);
    const aMonthAgo = new Date();
    aMonthAgo.setHours(0, 0, 0, 0);
    aMonthAgo.setDate(yesterdayDateOnly.getDate() - 30);

    const present = await globalDailyStateService.sumLast30Days(
        yesterdayDateOnly
    );
    const past = await globalDailyStateService.sumLast30Days(aMonthAgo);

    const growthToAdd = {
        date: yesterdayDateOnly,
        claimed: calculateGrowth(past.tClaimed, present.tClaimed),
        claims: calculateGrowth(past.tClaims, present.tClaims),
        beneficiaries: calculateGrowth(
            past.tBeneficiaries,
            present.tBeneficiaries
        ),
        raised: calculateGrowth(past.tRaised, present.tRaised),
        backers: calculateGrowth(past.tBackers, present.tBackers),
        fundingRate: calculateGrowth(past.fundingRate, present.fundingRate),
        volume: calculateGrowth(past.tVolume, present.tVolume),
        transactions: calculateGrowth(
            past.tTransactions,
            present.tTransactions
        ),
        reach: calculateGrowth(past.tReach, present.tReach),
        reachOut: calculateGrowth(past.tReachOut, present.tReachOut),
    };
    await globalGrowthService.add(growthToAdd);
}

async function calculateInflowOutflow(
    yesterdayDateOnly: Date,
    lastGlobalMetrics: GlobalDailyStateCreationAttributes
) {
    let totalRaised = '0';
    let totalDistributed = '0';
    let totalBeneficiaries = 0;

    const getPublicCommunitiesSum = async (
        date: Date
    ): Promise<{
        totalClaimed: string;
        totalClaims: number;
        totalBeneficiaries: number;
        totalRaised: string;
    }> => {
        const query = `select sum(cs.claimed) "totalClaimed",
                        sum(cs.claims) "totalClaims",
                        sum(cs.beneficiaries) "totalBeneficiaries",
                        sum(cs.raised) "totalRaised"
                from ubi_community_daily_state cs, community c
                where cs."communityId" = c.id
                and c.status = 'valid'
                and c.visibility = 'public'
                and cs.date = '${date.toISOString().split('T')[0]}'`;

        const result = await sequelize.query<{
            totalClaimed: string;
            totalClaims: string;
            totalBeneficiaries: string;
            totalRaised: string;
        }>(query, { type: QueryTypes.SELECT });

        return {
            totalClaimed: result[0].totalClaimed,
            totalClaims: parseInt(result[0].totalClaims, 10),
            totalBeneficiaries: parseInt(result[0].totalBeneficiaries, 10),
            totalRaised: result[0].totalRaised,
        };
    };

    const communitiesYesterday = await getPublicCommunitiesSum(
        yesterdayDateOnly
    );

    totalRaised = new BigNumber(lastGlobalMetrics.totalRaised)
        .plus(communitiesYesterday.totalRaised)
        .toString();
    totalDistributed = new BigNumber(lastGlobalMetrics.totalDistributed)
        .plus(communitiesYesterday.totalClaimed)
        .toString();
    totalBeneficiaries =
        lastGlobalMetrics.totalBeneficiaries +
        communitiesYesterday.totalBeneficiaries;
    const totalBackers = await InflowService.countEvergreenBackers();

    return {
        totalRaised,
        totalDistributed,
        totalBeneficiaries,
        totalBackers,
        communitiesYesterday,
    };
}

async function calculateUbiPulse(
    todayMidnightTime: Date,
    yesterdayDateOnly: Date
) {
    const backersAndFunding =
        await InflowService.uniqueBackersAndFundingLast30Days(
            todayMidnightTime
        );
    const communitiesAvgYesterday =
        await CommunityDailyMetricsService.getCommunitiesAvg(yesterdayDateOnly);

    const givingRate = parseFloat(
        new BigNumber(backersAndFunding.funding)
            .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
            .dividedBy(backersAndFunding.backers)
            .dividedBy(30)
            .decimalPlaces(2, 1)
            .toString()
    );
    const ubiRate = communitiesAvgYesterday.avgUbiRate;
    const avgComulativeUbi = await CommunityContractService.avgComulativeUbi();
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
    lastGlobalMetrics: GlobalDailyStateCreationAttributes
) {
    const reachedAddressService = new ReachedAddressService();
    let totalVolume = '0';
    let totalTransactions = '0';

    const getAllByDay = async (
        date: Date
    ): Promise<{
        reach: string[];
        reachOut: string[];
        volume: string;
        transactions: number;
    }> => {
        const uniqueAddressesReached =
            await models.beneficiaryTransaction.findAll({
                attributes: [[fn('distinct', col('withAddress')), 'addresses']],
                where: { date },
                raw: true,
            }); // this is an array, wich can be empty (return no rows)
        const uniqueAddressesReachedOut =
            await models.beneficiaryTransaction.findAll({
                attributes: [[fn('distinct', col('withAddress')), 'addresses']],
                where: {
                    date,
                    withAddress: {
                        [Op.notIn]: Sequelize.literal(
                            '(select distinct address from beneficiary)'
                        ),
                    },
                },
                raw: true,
            }); // this is an array, wich can be empty (return no rows)
        const volumeAndTransactions = (
            await models.beneficiaryTransaction.findAll({
                attributes: [
                    [fn('coalesce', fn('sum', col('amount')), 0), 'volume'],
                    [fn('count', col('tx')), 'transactions'],
                ],
                where: { date },
                raw: true,
            })
        )[0] as any; // this is a single result, that, if there's nothing, the result is zero
        // result is { volume: null, transactions: '0' } if nothing has happened
        console.log(volumeAndTransactions);
        return {
            reach:
                uniqueAddressesReached.length === 0
                    ? []
                    : uniqueAddressesReached.map((a: any) => a.addresses),
            reachOut:
                uniqueAddressesReachedOut.length === 0
                    ? []
                    : uniqueAddressesReachedOut.map((a: any) => a.addresses),
            volume:
                volumeAndTransactions.volume === null
                    ? '0'
                    : volumeAndTransactions.volume,
            transactions: parseInt(volumeAndTransactions.transactions, 10),
        };
    };

    const volumeTransactionsAndAddresses = await getAllByDay(yesterdayDateOnly);

    const { volume, transactions } = volumeTransactionsAndAddresses;
    const reach = volumeTransactionsAndAddresses.reach.length;
    const reachOut = volumeTransactionsAndAddresses.reachOut.length;
    await reachedAddressService.updateReachedList(
        volumeTransactionsAndAddresses.reach // no need to concat reachOut. reach as all new addresses
    );
    // TODO: spending rate
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
    todayMidnightTime: Date,
    communitiesAvgYesterday: {
        medianSSI: number;
        avgUbiRate: number;
        avgEstimatedDuration: number;
    }
) {
    const reachedAddressService = new ReachedAddressService();
    const globalDailyStateService = new GlobalDailyStateService();
    const last4DaysAvgSSI =
        await globalDailyStateService.getLast4AvgMedianSSI();

    const monthlyClaimed = await ClaimService.getMonthlyClaimed(
        todayMidnightTime
    );
    const monthlyRaised = await InflowService.getMonthlyRaised(
        todayMidnightTime
    );

    // chart data by day, all communities sum
    // remaining data are in communitiesYesterday
    const fundingRate = parseFloat(
        new BigNumber(monthlyRaised)
            .minus(monthlyClaimed)
            .dividedBy(monthlyRaised)
            .multipliedBy(100)
            .toFixed(2, 1)
    );

    const allReachEver = await reachedAddressService.getAllReachedEver();

    const avgMedianSSI = mean(
        last4DaysAvgSSI.concat([communitiesAvgYesterday.medianSSI])
    );

    return {
        fundingRate,
        allReachEver,
        avgMedianSSI,
    };
}

/**
 * As this is all calculated past midnight, everything is from yesterdayDateOnly
 */
export async function calcuateGlobalMetrics(): Promise<void> {
    // const reachedAddressService = new ReachedAddressService();
    const globalDailyStateService = new GlobalDailyStateService();
    const todayMidnightTime = new Date();
    todayMidnightTime.setHours(0, 0, 0, 0);
    const yesterdayDateOnly = new Date(); // yesterdayDateOnly
    yesterdayDateOnly.setHours(0, 0, 0, 0);
    yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);

    // get last global metrics
    let lastGlobalMetrics: GlobalDailyStateCreationAttributes;
    const last = await models.globalDailyState.findAll({
        order: [['date', 'DESC']],
        limit: 1,
        raw: true,
    });
    if (last.length === 0) {
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
            totalBeneficiaries: 0,
            totalDistributed: '0',
            totalRaised: '0',
            totalReach: BigInt(0),
            totalReachOut: BigInt(0),
            totalTransactions: BigInt(0),
            totalVolume: '0',
            transactions: 0,
            ubiRate: 0,
            volume: '0',
            date: new Date(),
        };
    } else {
        lastGlobalMetrics = last[0];
    }

    // inflow / outflow
    const {
        totalRaised,
        totalDistributed,
        totalBackers,
        totalBeneficiaries,
        communitiesYesterday,
    } = await calculateInflowOutflow(yesterdayDateOnly, lastGlobalMetrics);

    // ubi pulse
    const {
        givingRate,
        ubiRate,
        avgComulativeUbi,
        avgUbiDuration,
        backersAndFunding,
        communitiesAvgYesterday,
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
        await calculateChartsData(todayMidnightTime, communitiesAvgYesterday);

    // register new global daily state
    await globalDailyStateService.add({
        date: yesterdayDateOnly,
        avgMedianSSI: Math.round(avgMedianSSI * 100) / 100,
        claimed: communitiesYesterday.totalClaimed,
        claims: communitiesYesterday.totalClaims,
        beneficiaries: communitiesYesterday.totalBeneficiaries,
        raised: communitiesYesterday.totalRaised,
        backers: backersAndFunding.backers,
        volume,
        transactions,
        reach,
        reachOut,
        totalRaised,
        totalDistributed,
        totalBackers,
        totalBeneficiaries,
        givingRate,
        ubiRate: Math.round(ubiRate * 100) / 100,
        fundingRate,
        spendingRate,
        avgComulativeUbi,
        avgUbiDuration,
        totalVolume,
        totalTransactions: BigInt(totalTransactions),
        totalReach: BigInt(allReachEver.reach),
        totalReachOut: BigInt(allReachEver.reachOut),
    });

    if ((await globalDailyStateService.count()) > 60) {
        // calculate global growth
        await calculateMetricsGrowth(globalDailyStateService);
    }
}
