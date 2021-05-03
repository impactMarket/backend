import GlobalDailyStateService from '@services/global/globalDailyState';
import GlobalGrowthService from '@services/global/globalGrowth';
import ReachedAddressService from '@services/reachedAddress';
import BeneficiaryTransactionService from '@services/ubi/beneficiaryTransaction';
import ClaimService from '@services/ubi/claim';
import CommunityContractService from '@services/ubi/communityContract';
import CommunityDailyMetricsService from '@services/ubi/communityDailyMetrics';
import CommunityDailyStateService from '@services/ubi/communityDailyState';
import InflowService from '@services/ubi/inflow';
import { Logger } from '@utils/logger';
import BigNumber from 'bignumber.js';
import { mean } from 'mathjs';

import config from '../../../config';

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

function calculateGrowth(
    past: string | BigInt | number,
    now: string | BigInt | number
): number {
    let r: number | undefined = undefined;
    if (typeof past === 'string' && typeof now === 'string') {
        r = new BigNumber(now)
            .minus(new BigNumber(past))
            .dividedBy(new BigNumber(past))
            .multipliedBy(100)
            .toNumber();
    } else if (past instanceof BigInt && now instanceof BigInt) {
        r = Number(((BigInt(now) - BigInt(past)) / BigInt(past)) * BigInt(100));
    } else if (typeof past === 'number' && typeof now === 'number') {
        r = ((now - past) / past) * 100;
    }
    if (r !== undefined) {
        return Math.round(r * 10) / 10;
    }
    throw new Error('Invalid input!');
}

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

/**
 * As this is all calculated past midnight, everything is from yesterdayDateOnly
 */
export async function calcuateGlobalMetrics(): Promise<void> {
    const reachedAddressService = new ReachedAddressService();
    const globalDailyStateService = new GlobalDailyStateService();
    const todayMidnightTime = new Date();
    todayMidnightTime.setHours(0, 0, 0, 0);
    const yesterdayDateOnly = new Date(); // yesterdayDateOnly
    yesterdayDateOnly.setHours(0, 0, 0, 0);
    yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);
    const lastGlobalMetrics = await globalDailyStateService.getLast();
    const last4DaysAvgSSI = await globalDailyStateService.getLast4AvgMedianSSI();
    const communitiesYesterday = await CommunityDailyStateService.getPublicCommunitiesSum(
        yesterdayDateOnly
    );
    Logger.error(JSON.stringify(communitiesYesterday));
    const volumeTransactionsAndAddresses = await BeneficiaryTransactionService.getAllByDay(
        yesterdayDateOnly
    );
    const backersAndFunding = await InflowService.uniqueBackersAndFundingLast30Days(
        todayMidnightTime
    );
    const communitiesAvgYesterday = await CommunityDailyMetricsService.getCommunitiesAvg(
        yesterdayDateOnly
    );

    const monthlyClaimed = await ClaimService.getMonthlyClaimed(
        todayMidnightTime
    );
    const monthlyRaised = await InflowService.getMonthlyRaised(
        todayMidnightTime
    );

    // inflow / outflow
    let totalRaised = '0';
    let totalDistributed = '0';
    let totalBeneficiaries = 0;
    let totalVolume = '0';
    let totalTransactions = '0';
    if (lastGlobalMetrics) {
        totalRaised = new BigNumber(lastGlobalMetrics.totalRaised)
            .plus(communitiesYesterday.totalRaised)
            .toString();
        totalDistributed = new BigNumber(lastGlobalMetrics.totalDistributed)
            .plus(communitiesYesterday.totalClaimed)
            .toString();
        totalBeneficiaries =
            lastGlobalMetrics.totalBeneficiaries +
            communitiesYesterday.totalBeneficiaries;
        totalVolume = new BigNumber(lastGlobalMetrics.totalVolume)
            .plus(volumeTransactionsAndAddresses.volume)
            .toString();
        totalTransactions = new BigNumber(
            lastGlobalMetrics.totalTransactions.toString()
        )
            .plus(volumeTransactionsAndAddresses.transactions)
            .toString();
    }
    const totalBackers = await InflowService.countEvergreenBackers();

    // ubi pulse
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
    // const avgUbiDuration = parseFloat(
    //     new BigNumber(avgComulativeUbi)
    //         .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
    //         .dividedBy(ubiRate)
    //         .dividedBy(30)
    //         .decimalPlaces(2, 1)
    //         .toString()
    // );
    const avgUbiDuration = communitiesAvgYesterday.avgEstimatedDuration;

    // economic activity
    const { volume, transactions } = volumeTransactionsAndAddresses;
    const reach = volumeTransactionsAndAddresses.reach.length;
    const reachOut = volumeTransactionsAndAddresses.reachOut.length;
    await reachedAddressService.updateReachedList(
        volumeTransactionsAndAddresses.reach // no need to concat reachOut. reach as all new addresses
    );
    // TODO: spending rate
    const spendingRate = 0;

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
