import { UbiCommunityDailyMetrics } from '@interfaces/ubi/ubiCommunityDailyMetrics';
import { Op } from 'sequelize';

import { models } from '../../database';
import { ICommunityMetrics } from '../../types';

export default class CommunityDailyMetricsService {
    public static community = models.community;
    public static ubiCommunityDailyMetrics = models.ubiCommunityDailyMetrics;

    public static async add(
        communityId: number,
        ssiDayAlone: number,
        ssi: number,
        ubiRate: number,
        estimatedDuration: number,
        date: Date
    ): Promise<UbiCommunityDailyMetrics> {
        return await this.ubiCommunityDailyMetrics.create({
            communityId,
            ssiDayAlone,
            ssi,
            ubiRate,
            estimatedDuration,
            date,
        });
    }

    public static async getLastMetrics(
        communityId: number
    ): Promise<ICommunityMetrics | undefined> {
        const historical = (await this.ubiCommunityDailyMetrics.findAll({
            attributes: ['ssi'],
            where: {
                communityId,
            },
            order: [['date', 'DESC']],
            limit: 15,
            raw: true,
        })) as any[];
        if (historical.length < 5) {
            // at least 5 days until showing data
            return undefined;
        }
        const lastMetrics = (
            await this.ubiCommunityDailyMetrics.findAll({
                attributes: [
                    'ssiDayAlone',
                    'ssi',
                    'ubiRate',
                    'estimatedDuration',
                ],
                where: {
                    communityId,
                },
                order: [['date', 'DESC']],
                limit: 1,
                raw: true,
            })
        )[0] as any;
        return {
            historicalSSI: historical.map((h) => h.ssi),
            ssiDayAlone: lastMetrics.ssiDayAlone,
            ssi: lastMetrics.ssi,
            ubiRate: lastMetrics.ubiRate,
            estimatedDuration: lastMetrics.estimatedDuration,
        };
    }

    public static async getHistoricalSSIByPublicId(
        publicId: string
    ): Promise<number[]> {
        const community = await this.community.findOne({ where: { publicId } });
        if (community === null) {
            return [];
        }
        const historical = await this.ubiCommunityDailyMetrics.findAll({
            attributes: ['ssi'],
            where: {
                communityId: community.id,
            },
            order: [['date', 'DESC']],
            limit: 15,
            raw: true,
        });
        if (historical.length < 5) {
            // at least 5 days until showing data
            return [];
        }
        return historical.map((h) => h.ssi);
    }

    public static async getHistoricalSSI(
        communityId: number
    ): Promise<number[]> {
        const historical = await this.ubiCommunityDailyMetrics.findAll({
            attributes: ['ssi'],
            where: {
                communityId,
            },
            order: [['date', 'DESC']],
            limit: 15,
            raw: true,
        });
        if (historical.length < 5) {
            // at least 5 days until showing data
            return [];
        }
        return historical.map((h) => h.ssi);
    }

    public static async getSSILast4Days(): Promise<Map<number, number[]>> {
        const result = new Map<number, number[]>();
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // seven days ago, from yesterdayDateOnly
        const fiveDaysAgo = new Date(todayMidnightTime.getTime() - 345600000); // 4 * 24 * 60 * 60 * 1000
        const raw = await this.ubiCommunityDailyMetrics.findAll({
            attributes: ['communityId', 'ssi'],
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: fiveDaysAgo,
                },
            },
            raw: true,
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
