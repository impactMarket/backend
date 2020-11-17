import { col, fn, Op } from 'sequelize';
import { CommunityDailyMetrics } from '../db/models/communityDailyMetrics';
import { ICommunityMetrics } from '../types';
import { median } from 'mathjs';


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

    public static async getLastMetrics(communityId: string): Promise<ICommunityMetrics | undefined> {
        const historical = (await CommunityDailyMetrics.findAll({
            attributes: [
                'ssi',
            ],
            where: {
                communityId,
            },
            order: [['date', 'DESC']],
            limit: 15,
        })) as any[];
        if (historical.length === 0) {
            return undefined;
        }
        const lastMetrics = (await CommunityDailyMetrics.findAll({
            attributes: [
                'ssiDayAlone',
                'ssi',
                'ubiRate',
                'estimatedDuration'
            ],
            where: {
                communityId,
            },
            order: [['date', 'DESC']],
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

    public static async getSSILast4Days(): Promise<Map<string, number[]>> {
        const result = new Map<string, number[]>();
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // seven days ago, from yesterdayDateOnly
        const fiveDaysAgo = new Date(todayMidnightTime.getTime() - 345600000); // 4 * 24 * 60 * 60 * 1000
        const raw = await CommunityDailyMetrics.findAll({
            attributes: ['communityId', 'ssi'],
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
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
        meadianSSI: number;
        avgUbiRate: number;
    }> {
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);

        const meadianSSI = median((await CommunityDailyMetrics.findAll({
            attributes: ['ssi'],
            where: {
                date: yesterdayDateOnly,
            }
        })).map((m) => m.ssi));

        const raw = (await CommunityDailyMetrics.findAll({
            attributes: [
                [fn('avg', col('ubiRate')), 'avgUbiRate'],
            ],
            where: {
                date: yesterdayDateOnly
            }
        }))[0];
        return {
            meadianSSI,
            avgUbiRate: parseFloat((raw as any).avgUbiRate),
        };
    }
}