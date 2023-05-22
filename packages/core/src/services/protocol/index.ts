import { Contract } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { queries } from '../../subgraph';
import { config } from '../../..';
import { ERC20ABI } from '../../contracts';
import BigNumber from 'bignumber.js';

export default class ProtocolService {
    public getMicroCreditData = async (): Promise<any> => {
        const subgraphData = await queries.microcredit.getGlobalData();

        // TODO: calculate applications { totalApplications, inReview }

        const estimatedMaturity = 0; // (paid back in the past 3 months / 3 / current debt)
        const avgBorrowedAmount = Math.round(
            subgraphData.totalBorrowed / subgraphData.activeBorrowers
        );
        const apr = 0; // (paid back past 7 months - borrowed past 7 months) / borrowed past 7 months / 7 * 12

        const provider = new JsonRpcProvider(config.jsonRpcUrl);
        const cUSD = new Contract(config.cUSDContractAddress, ERC20ABI, provider);
        const balance = await cUSD.balanceOf(config.microcreditContractAddress);

        return {
            totalApplications: 0,
            inReview: 0,
            estimatedMaturity,
            avgBorrowedAmount,
            apr,
            ...subgraphData,
            liquidityAvailable: new BigNumber(balance.toString()).dividedBy(new BigNumber(10).pow(18)).toNumber(),
        };
    };
}
