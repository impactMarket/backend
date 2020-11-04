import { CommunityDailyMetrics } from '../db/models/communityDailyMetrics';


export default class CommunityDailyMetricsService {

    public static async add(
        communityId: string,
        ssi: number,
        fundingRate: number,
        spendingRate: number,
        ubiRate: number,
        estimatedDuration: number,
        date: Date,
    ): Promise<CommunityDailyMetrics> {
        return await CommunityDailyMetrics.create({
            communityId,
            ssi,
            fundingRate,
            spendingRate,
            ubiRate,
            estimatedDuration,
            date,
        });
    }
}