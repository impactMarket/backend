import moment from 'moment';
import { Op, fn } from 'sequelize';
import { GlobalDailyState } from '../db/models/globalDailyState';
import Logger from '../loaders/logger';


export default class GlobalDailyStateService {

    public static async add(
        date: Date,
        meanSSI: number,
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
    ): Promise<GlobalDailyState> {
        return await GlobalDailyState.create({
            date,
            meanSSI,
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
        });
    }

    public static async getLast(): Promise<GlobalDailyState> {
        // it was null just once at the system's begin.
        return (await GlobalDailyState.findOne({
            order: [['date', 'DESC']],
        }))!;
    }
}