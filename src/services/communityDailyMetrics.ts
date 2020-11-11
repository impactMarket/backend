import { Op } from 'sequelize';
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

    public static async getSSILast5Days(): Promise<Map<string, number[]>> {
        const result = new Map<string, number[]>();
        const yesterday = new Date(new Date().getTime() - 86400000);
        yesterday.setHours(0, 0, 0, 0);
        // seven days ago, from yesterday
        const fiveDaysAgo = new Date(yesterday.getTime() - 432000000); // 5 * 24 * 60 * 60 * 1000
        const raw = await CommunityDailyMetrics.findAll({
            attributes: ['communityId', 'ssi'],
            where: {
                date: {
                    [Op.lte]: yesterday,
                    [Op.gte]: fiveDaysAgo,
                }
            }
        });
        for (let index = 0; index < raw.length; index++) {
            const element = raw[index];
            const c = result.get(element.communityId);
            let nc: number[] = [];
            if (c !== undefined) {
                nc = c;
            } else {
                nc = [];
            }
            nc.push(element.ssi);
            result.set(element.communityId, nc);
        }
        return result;
    }
}