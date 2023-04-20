import { queries } from '../../subgraph';

export default class MicrocreditService {
    public getGlobalData = async (): Promise<any> => {
        const subgraphData = await queries.microcredit.getGlobalData();

        // TODO: calculate applications { totalApplications, inReview }

        const estimatedMaturity = 0;   // (paid back in the past 3 months / 3 / current debt)
        const avgBorrowedAmount = Math.round(subgraphData.totalBorrowed / subgraphData.activeBorrowers);
        const apr = 0;  // (paid back past 7 months - borrowed past 7 months) / borrowed past 7 months / 7 * 12

        return {
            totalApplications: 0,
            inReview: 0,
            estimatedMaturity,
            avgBorrowedAmount,
            apr,
            ...subgraphData,
        }
    }
}