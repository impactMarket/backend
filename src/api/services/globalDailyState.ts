import {
    GlobalDailyState,
    GlobalDailyStateCreationAttributes,
} from '@models/globalDailyState';
import { Op } from 'sequelize';

import { models } from '../../database';

export default class GlobalDailyStateService {
    public static globalDailyState = models.globalDailyState;

    public static async add(
        state: GlobalDailyStateCreationAttributes
    ): Promise<GlobalDailyState> {
        return await this.globalDailyState.create(state);
    }

    public static async getLast4AvgMedianSSI(): Promise<number[]> {
        // it was null just once at the system's begin.
        const last = await this.globalDailyState.findAll({
            attributes: ['avgMedianSSI'],
            order: [['date', 'DESC']],
            limit: 4,
        });
        return last.map((g) => g.avgMedianSSI);
    }

    public static async getLast(): Promise<GlobalDailyState> {
        // it was null just once at the system's begin.
        const last = await this.globalDailyState.findAll({
            order: [['date', 'DESC']],
            limit: 1,
        });
        return last[0];
    }

    public static async getLast30Days(): Promise<GlobalDailyState[]> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        // it was null just once at the system's begin.
        return await this.globalDailyState.findAll({
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                },
            },
            order: [['date', 'DESC']],
        });
    }

    public static async last90DaysAvgSSI(): Promise<
        { date: Date; avgMedianSSI: number }[]
    > {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // 90 days ago, from todayMidnightTime
        const threeMonthsAgo = new Date(
            todayMidnightTime.getTime() - 7776000000
        ); // 90 * 24 * 60 * 60 * 1000
        const result = await this.globalDailyState.findAll({
            attributes: ['date', 'avgMedianSSI'],
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: threeMonthsAgo,
                },
            },
            order: [['date', 'DESC']],
        });
        // it was null just once at the system's begin.
        return result.map((g) => ({
            date: g.date,
            avgMedianSSI: g.avgMedianSSI,
        }));
    }
}
