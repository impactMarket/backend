import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import config from '../../config';
import Logger from '../../loaders/logger';
import ImMetadataService from '../../services/imMetadata';
import ERC20ABI from '../../contracts/ERC20ABI.json';
import UserService from '../../services/user';
import ClaimService from '../../services/claim';
import InflowService from '../../services/inflow';
import GlobalDailyStateService from '../../services/globalDailyState';
import CommunityDailyStateService from '../../services/communityDailyState';
import CommunityContractService from '../../services/communityContract';


export async function calcuateGlobalMetrics(): Promise<void> {
    Logger.info('Calculating global metrics...');
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const cUSDContract = new ethers.Contract(config.cUSDContractAddress, ERC20ABI, provider);
    const queryFilterLastBlock = await ImMetadataService.getQueryFilterLastBlock();
    const allUsersAddress = await UserService.getAllAddresses();

    const lastGlobalMetrics = await GlobalDailyStateService.getLast();
    const communitiesToday = await CommunityDailyStateService.getTodayCommunitiesSum();

    const currentBlockNumber = await provider.getBlockNumber();
    const fromUsers = await cUSDContract.queryFilter(
        cUSDContract.filters.Transfer(allUsersAddress),
        queryFilterLastBlock,
        'latest'
    );
    const toUsers = await cUSDContract.queryFilter(
        cUSDContract.filters.Transfer(null, allUsersAddress),
        queryFilterLastBlock,
        'latest'
    );

    const addressFromUsers: string[] = fromUsers.map((u) => u.args!.to);
    const addressToUsers: string[] = toUsers.map((u) => u.args!.from);

    const amountFromUsers: string[] = fromUsers.map((u) => u.args!.value.toString());
    const amountToUsers: string[] = toUsers.map((u) => u.args!.value.toString());

    const backersAndFunding = await InflowService.uniqueBackersAndFundingLast30Days();
    const beneficiariesAndClaimed = await ClaimService.uniqueBeneficiariesAndClaimedLast7Days();

    const monthlyClaimed = await ClaimService.getMonthlyClaimed();
    const monthlyRaised = await InflowService.getMonthlyRaised();

    // inflow / outflow
    const totalRaised = lastGlobalMetrics.totalRaised + communitiesToday.totalRaised;
    const totalDistributed = lastGlobalMetrics.totalDistributed + communitiesToday.totalClaimed;
    const totalBackers = await InflowService.countEvergreenBackers();
    const totalBeneficiaries = lastGlobalMetrics.totalBeneficiaries + communitiesToday.totalBeneficiaries;

    // ubi pulse
    const givingRate = new BigNumber(backersAndFunding.funding)
        .dividedBy(backersAndFunding.backers)
        .dividedBy(30)
        .decimalPlaces(2, 1)
        .toString();
    const ubiRate = parseFloat(
        new BigNumber(beneficiariesAndClaimed.claimed)
            .dividedBy(beneficiariesAndClaimed.beneficiaries)
            .dividedBy(7)
            .decimalPlaces(2, 1)
            .toString()
    );
    const avgComulativeUbi = await CommunityContractService.avgComulativeUbi();
    const avgUbiDuration = parseFloat(
        new BigNumber(avgComulativeUbi)
            .dividedBy(ubiRate)
            .dividedBy(30)
            .decimalPlaces(2, 1)
            .toString()
    );

    // economic activity
    const volume = amountFromUsers.concat(amountToUsers).reduce<BigNumber>(
        (previousValue: BigNumber, currentValue: string) => previousValue.plus(currentValue),
        new BigNumber(0)
    ).toString();
    const transactions = fromUsers.length + toUsers.length;
    const reach = new Set(addressFromUsers.concat(addressToUsers));
    // TODO: spending rate
    const spendingRate = 0;

    // chart data by day, all communities sum
    // remaining data are in communitiesToday
    const fundingRate = parseFloat(
        new BigNumber(monthlyRaised)
            .minus(monthlyClaimed)
            .dividedBy(monthlyRaised)
            .multipliedBy(100)
            .toFixed(2, 1)
    );
    const totalVolume = lastGlobalMetrics.totalVolume + volume;
    const totalTransactions = lastGlobalMetrics.totalTransactions.toString() + transactions;

    // register new global daily state
    await GlobalDailyStateService.add(
        new Date(),
        communitiesToday.avgSSI,
        communitiesToday.totalClaimed,
        communitiesToday.totalClaims,
        communitiesToday.totalBeneficiaries,
        communitiesToday.totalRaised,
        communitiesToday.totalBackers,
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
        totalTransactions
    );

    // save currentBlockNumber as QueryFilterLastBlock
    await ImMetadataService.setQueryFilterLastBlock(currentBlockNumber);
}
