import { col, fn, Op } from 'sequelize';
import { CommunityDailyMetrics } from '../db/models/communityDailyMetrics';
import { ICommunityMetrics } from '../types';


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

    public static async getLastMetrics(communityId: string): Promise<ICommunityMetrics> {
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);
        // 30 days ago, from yesterdayDateOnly
        const aMonthAgo = new Date(yesterdayDateOnly.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const historical = (await CommunityDailyMetrics.findAll({
            attributes: [
                'ssi',
            ],
            where: {
                communityId,
                date: {
                    [Op.lte]: yesterdayDateOnly,
                    [Op.gte]: aMonthAgo,
                }
            },
        })) as any[];
        const lastMetrics = (await CommunityDailyMetrics.findAll({
            attributes: [
                'ssiDayAlone',
                'ssi',
                'ubiRate',
                'estimatedDuration'
            ],
            where: {
                communityId,
                date: yesterdayDateOnly
            },
            limit: 1,
        }))[0] as any;
        return {
            historicalSSI: historical.map((h) => h.ssi),
            ssiDayAlone: lastMetrics.ssiDayAlone,
            ssi: lastMetrics.ssi,
            ubiRate: lastMetrics.ubiRate,
            estimatedDuration: lastMetrics.estimatedDuration,
        }
    }

    public static async getSSILast5Days(): Promise<Map<string, number[]>> {
        const result = new Map<string, number[]>();
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);
        // seven days ago, from yesterdayDateOnly
        const fiveDaysAgo = new Date(yesterdayDateOnly.getTime() - 432000000); // 5 * 24 * 60 * 60 * 1000
        const raw = await CommunityDailyMetrics.findAll({
            attributes: ['communityId', 'ssi'],
            where: {
                date: {
                    [Op.lte]: yesterdayDateOnly,
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

    public static async getCommunitiesAvgYesterday(): Promise<{
        avgSSI: number;
        avgUbiRate: number;
    }> {
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);
        const raw = (await CommunityDailyMetrics.findAll({
            attributes: [
                [fn('avg', col('ssi')), 'avgSSI'],
                [fn('avg', col('ubiRate')), 'avgUbiRate'],
            ],
            where: {
                date: yesterdayDateOnly
            }
        }))[0];
        return {
            avgSSI: Math.round(parseFloat((raw as any).avgSSI) * 100) / 100,
            avgUbiRate: parseFloat((raw as any).avgUbiRate),
        };
    }
}