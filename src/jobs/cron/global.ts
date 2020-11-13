import BigNumber from 'bignumber.js';
import ClaimService from '../../services/claim';
import InflowService from '../../services/inflow';
import GlobalDailyStateService from '../../services/globalDailyState';
import CommunityDailyStateService from '../../services/communityDailyState';
import CommunityContractService from '../../services/communityContract';
import ReachedAddressService from '../../services/reachedAddress';
import CommunityDailyMetricsService from '../../services/communityDailyMetrics';
import BeneficiaryTransactionService from '../../services/beneficiaryTransaction';
import Logger from '../../loaders/logger';


/**
 * As this is all calculated past midnight, everything is from yesterday
 */
export async function calcuateGlobalMetrics(): Promise<void> {
    Logger.info('Calculating global metrics...');
    const yesterday = new Date(new Date().getTime() - 86400000); // yesterday
    const lastGlobalMetrics = await GlobalDailyStateService.getLast();
    const communitiesYesterday = await CommunityDailyStateService.getYesterdayCommunitiesSum();
    const volumeTransactionsAndAddresses = await BeneficiaryTransactionService.getAllByDay(yesterday);
    const backersAndFunding = await InflowService.uniqueBackersAndFundingLast30Days();
    const communitiesAvgYesterday = await CommunityDailyMetricsService.getCommunitiesAvgYesterday();

    const monthlyClaimed = await ClaimService.getMonthlyClaimed();
    const monthlyRaised = await InflowService.getMonthlyRaised();

    // inflow / outflow
    const totalRaised = new BigNumber(lastGlobalMetrics.totalRaised).plus(communitiesYesterday.totalRaised).toString();
    const totalDistributed = new BigNumber(lastGlobalMetrics.totalDistributed).plus(communitiesYesterday.totalClaimed).toString();
    const totalBackers = await InflowService.countEvergreenBackers();
    const totalBeneficiaries = lastGlobalMetrics.totalBeneficiaries + communitiesYesterday.totalBeneficiaries;

    // ubi pulse
    const givingRate = parseFloat(
        new BigNumber(backersAndFunding.funding)
            .dividedBy(backersAndFunding.backers)
            .dividedBy(30)
            .decimalPlaces(2, 1)
            .toString()
    );
    const ubiRate = communitiesAvgYesterday.avgUbiRate;
    const avgComulativeUbi = await CommunityContractService.avgComulativeUbi();
    const avgUbiDuration = parseFloat(
        new BigNumber(avgComulativeUbi)
            .dividedBy(ubiRate)
            .dividedBy(30)
            .decimalPlaces(2, 1)
            .toString()
    );

    // economic activity
    const volume = volumeTransactionsAndAddresses.volume;
    const transactions = volumeTransactionsAndAddresses.transactions;
    const reach = await ReachedAddressService.addNewReachedYesterday(volumeTransactionsAndAddresses.uniqueAddressesReached);
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
    const totalVolume = new BigNumber(lastGlobalMetrics.totalVolume).plus(volume).toString();
    const totalTransactions = new BigNumber(lastGlobalMetrics.totalTransactions.toString()).plus(transactions).toString();
    const totalReach = new BigNumber(lastGlobalMetrics.totalReach.toString()).plus(reach).toString();

    // register new global daily state
    await GlobalDailyStateService.add(
        yesterday,
        communitiesAvgYesterday.avgSSI,
        communitiesYesterday.totalClaimed,
        communitiesYesterday.totalClaims,
        communitiesYesterday.totalBeneficiaries,
        communitiesYesterday.totalRaised,
        backersAndFunding.backers,
        volume,
        transactions,
        reach,
        totalRaised,
        totalDistributed,
        totalBackers,
        totalBeneficiaries,
        givingRate,
        ubiRate,
        fundingRate,
        spendingRate,
        avgComulativeUbi,
        avgUbiDuration,
        totalVolume,
        BigInt(totalTransactions),
        BigInt(totalReach),
    );
}
