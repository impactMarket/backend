import { CommunityDailyMetrics } from '../db/models/communityDailyMetrics';


export default class CommunityDailyMetricsService {

    public static async add(
        communityId: string,
        ssiDayAlone: number,
        ssi: number,
        ubiRate: number,
        estimatedDuration: number,
        date: Date,
    ): Promise<CommunityDailyMetrics> {
        return await CommunityDailyMetrics.create({
            communityId,
            ssiDayAlone,
            ssi,
            ubiRate,
            estimatedDuration,
            date,
        });
    }
}