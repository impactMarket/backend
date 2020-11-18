import moment from 'moment';
import { Op, fn } from 'sequelize';
import { GlobalDailyState } from '../db/models/globalDailyState';
import Logger from '../loaders/logger';


export default class GlobalDailyStateService {

    public static async add(
        date: Date,
        avgMedianSSI: number,
        claimed: string,
        claims: number,
        beneficiaries: number,
        raised: string,
        backers: number,
        volume: string,
        transactions: number,
        reach: number,
        totalRaised: string,
        totalDistributed: string,
        totalBackers: number,
        totalBeneficiaries: number,
        givingRate: number,
        ubiRate: number,
        fundingRate: number,
        spendingRate: number,
        avgComulativeUbi: string,
        avgUbiDuration: number,
        totalVolume: string,
        totalTransactions: BigInt,
        totalReach: BigInt,
    ): Promise<GlobalDailyState> {
        return await GlobalDailyState.create({
            date,
            avgMedianSSI,
            claimed,
            claims,
            beneficiaries,
            raised,
            backers,
            volume,
            transactions,
            reach,
            totalRaised,
            totalDistributed,
            totalBackers,
            totalBeneficiaries,
            givingRate,
            ubiRate,
            fundingRate,
            spendingRate,
            avgComulativeUbi,
            avgUbiDuration,
            totalVolume,
            totalTransactions,
            totalReach
        });
    }

    public static async getLast4AvgMedianSSI(): Promise<number[]> {
        // it was null just once at the system's begin.
        const last = await GlobalDailyState.findAll({
            attributes: ['avgMedianSSI'],
            order: [['date', 'DESC']],
            limit: 4
        });
        return last.map((g) => g.avgMedianSSI);
    }

    public static async getLast(): Promise<GlobalDailyState> {
        // it was null just once at the system's begin.
        const last = await GlobalDailyState.findAll({
            order: [['date', 'DESC']],
            limit: 1
        });
        return last[0];
    }

    public static async getLast30Days(): Promise<GlobalDailyState[]> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        // it was null just once at the system's begin.
        return await GlobalDailyState.findAll({
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                }
            },
            order: [['date', 'DESC']],
        });
    }

    public static async last90DaysAvgSSI(): Promise<{date: Date, avgMedianSSI: number}[]> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // 90 days ago, from todayMidnightTime
        const threeMonthsAgo = new Date(todayMidnightTime.getTime() - 7776000000); // 90 * 24 * 60 * 60 * 1000
        const result = await GlobalDailyState.findAll({
            attributes: ['date', 'avgMedianSSI'],
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: threeMonthsAgo,
                }
            },
            order: [['date', 'DESC']],
        });
        // it was null just once at the system's begin.
        return result.map((g) => ({ date: g.date, avgMedianSSI: g.avgMedianSSI }));
    }
}