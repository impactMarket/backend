import {
    GlobalDailyState,
    GlobalDailyStateCreationAttributes,
} from '@models/globalDailyState';
import { col, fn, Op } from 'sequelize';

import { models } from '../database';

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

    public static async sumLast30Days(
        from: Date
    ): Promise<{
        tClaimed: string;
        tClaims: number;
        tBeneficiaries: number;
        tRaised: string;
        tBackers: number;
        fundingRate: number;
        tVolume: string;
        tTransactions: string;
        tReach: string;
        tReachOut: string;
    }> {
        // it was null just once at the system's begin.
        const aMonthAgo = new Date(from.getTime());
        aMonthAgo.setDate(aMonthAgo.getDate() - 30);
        const result = await this.globalDailyState.findOne<any>({
            attributes: [
                [fn('sum', col('claimed')), 'tClaimed'],
                [fn('sum', col('claims')), 'tClaims'],
                [fn('sum', col('beneficiaries')), 'tBeneficiaries'],
                [fn('sum', col('raised')), 'tRaised'],
                [fn('sum', col('backers')), 'tBackers'],
                [fn('sum', col('transactions')), 'tTransactions'],
                [fn('sum', col('volume')), 'tVolume'],
                [fn('sum', col('reach')), 'tReach'],
                [fn('sum', col('reachOut')), 'tReachOut'],
            ],
            where: {
                date: {
                    [Op.lt]: from,
                    [Op.gte]: aMonthAgo,
                },
            },
        });
        const frDate = new Date();
        frDate.setDate(from.getDate() - 1);
        const fr = await this.globalDailyState.findOne<any>({
            attributes: ['fundingRate'],
            where: {
                date: frDate,
            },
        });
        return {
            tClaimed: result.tClaimed,
            tClaims: parseInt(result.tClaims, 10),
            tBeneficiaries: parseInt(result.tBeneficiaries, 10),
            tRaised: result.tRaised,
            tBackers: parseInt(result.tBackers, 10),
            fundingRate: parseInt(fr.fundingRate, 10),
            tVolume: result.tVolume,
            tTransactions: result.tTransactions,
            tReach: result.tReach,
            tReachOut: result.tReachOut,
        };
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
