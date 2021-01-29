import { Community } from '@models/community';
import { CommunityDailyMetrics } from '@models/communityDailyMetrics';
import { median } from 'mathjs';
import { col, fn, Op } from 'sequelize';

import { ICommunityMetrics } from '../types';
import { models } from '../database';

export default class CommunityDailyMetricsService {
    public static communityDailyMetrics = models.communityDailyMetrics;

    public static async add(
        communityId: string,
        ssiDayAlone: number,
        ssi: number,
        ubiRate: number,
        estimatedDuration: number,
        date: Date
    ): Promise<CommunityDailyMetrics> {
        return await this.communityDailyMetrics.create({
            communityId,
            ssiDayAlone,
            ssi,
            ubiRate,
            estimatedDuration,
            date,
        });
    }

    public static async getLastMetrics(
        communityId: string
    ): Promise<ICommunityMetrics | undefined> {
        const historical = (await this.communityDailyMetrics.findAll({
            attributes: ['ssi'],
            where: {
                communityId,
            },
            order: [['date', 'DESC']],
            limit: 15,
        })) as any[];
        if (historical.length < 5) {
            // at least 5 days until showing data
            return undefined;
        }
        const lastMetrics = (
            await this.communityDailyMetrics.findAll({
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

    public static async getHistoricalSSI(
        communityId: string
    ): Promise<number[]> {
        const historical = await this.communityDailyMetrics.findAll({
            attributes: ['ssi'],
            where: {
                communityId,
            },
            order: [['date', 'DESC']],
            limit: 15,
        });
        if (historical.length < 5) {
            // at least 5 days until showing data
            return [];
        }
        return historical.map((h) => h.ssi);
    }

    public static async getSSILast4Days(): Promise<Map<string, number[]>> {
        const result = new Map<string, number[]>();
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // seven days ago, from yesterdayDateOnly
        const fiveDaysAgo = new Date(todayMidnightTime.getTime() - 345600000); // 4 * 24 * 60 * 60 * 1000
        const raw = await this.communityDailyMetrics.findAll({
            attributes: ['communityId', 'ssi'],
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: fiveDaysAgo,
                },
            },
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
        medianSSI: number;
        avgUbiRate: number;
        avgEstimatedDuration: number;
    }> {
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);
        const fiveDaysAgo = new Date(new Date().getTime() - 432000000);
        fiveDaysAgo.setHours(0, 0, 0, 0);

        const onlyPublicValidCommunities = (
            await Community.findAll({
                attributes: ['publicId'],
                where: {
                    visibility: 'public',
                    status: 'valid',
                    started: {
                        [Op.lt]: fiveDaysAgo,
                    },
                },
            })
        ).map((c) => c.publicId);

        // TODO: only communities with more that 5 days
        const medianSSI = median(
            (
                await this.communityDailyMetrics.findAll({
                    attributes: ['ssi'],
                    where: {
                        date: yesterdayDateOnly,
                        communityId: { [Op.in]: onlyPublicValidCommunities },
                    },
                })
            ).map((m) => m.ssi)
        );

        const raw = (
            await this.communityDailyMetrics.findAll({
                attributes: [
                    [fn('avg', col('ubiRate')), 'avgUbiRate'],
                    [
                        fn('avg', col('estimatedDuration')),
                        'avgEstimatedDuration',
                    ],
                ],
                where: {
                    date: yesterdayDateOnly,
                    communityId: { [Op.in]: onlyPublicValidCommunities },
                },
            })
        )[0];
        return {
            medianSSI,
            avgUbiRate: parseFloat((raw as any).avgUbiRate),
            avgEstimatedDuration: parseFloat((raw as any).avgEstimatedDuration),
        };
    }
}
