import moment from 'moment';
import { Op, fn } from 'sequelize';
import { GlobalDailyState } from '../db/models/globalDailyState';
import Logger from '../loaders/logger';


export default class GlobalDailyStateService {

    public static async add(
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