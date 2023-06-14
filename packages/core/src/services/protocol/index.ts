import { Contract } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { config } from '../../..';
import { ERC20ABI } from '../../contracts';
import BigNumber from 'bignumber.js';
import {
    getMicroCreditStatsLastDays,
    getGlobalData,
} from '../../subgraph/queries/microcredit';

export default class ProtocolService {
    public getMicroCreditData = async (): Promise<any> => {
        const subgraphData = await getGlobalData();
        const todayDayId = Math.floor(Date.now() / 1000 / 86400);
        const thirtyDaysData = await getMicroCreditStatsLastDays(
            todayDayId - 30,
            todayDayId
        );
        const ninetyDaysData = await getMicroCreditStatsLastDays(
            todayDayId - 90,
            todayDayId
        );

        // TODO: calculate applications { totalApplications, inReview }

        // current debt / (paid back in the past 3 months / 3)
        const estimatedMaturity =
            subgraphData.currentDebt / (ninetyDaysData.repaid / 3);
        const avgBorrowedAmount = Math.round(
            subgraphData.borrowed / subgraphData.loans
        );
        // interest paid in the past month / Debt paid in the past month * 12
        const apr = (thirtyDaysData.interest / thirtyDaysData.repaid) * 12 * 100;

        const provider = new JsonRpcProvider(config.jsonRpcUrl);
        const cUSD = new Contract(
            config.cUSDContractAddress,
            ERC20ABI,
            provider
        );
        const balance = await cUSD.balanceOf(config.microcreditContractAddress);

        return {
            totalApplications: 200,
            inReview: 25,
            estimatedMaturity,
            avgBorrowedAmount,
            apr,
            ...subgraphData,
            liquidityAvailable: new BigNumber(balance.toString())
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
        };
    };
}
