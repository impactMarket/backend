import { col, fn } from 'sequelize';
import {
    // BeneficiaryTransaction,
    BeneficiaryTransactionCreationAttributes
} from '../db/models/beneficiaryTransaction';
import database from '../loaders/database';
import { Logger } from '../loaders/logger';

const db = database();
export default class BeneficiaryTransactionService {

    public static async add(beneficiaryTx: BeneficiaryTransactionCreationAttributes): Promise<void> {
        try {
            await db.models.beneficiaryTransaction.create(beneficiaryTx);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error('Error inserting new BeneficiaryTransaction. Data = ' + JSON.stringify(beneficiaryTx));
                Logger.error(e);
            }
        }
        return;
    }

    public static async getAllByDay(date: Date): Promise<{
        uniqueAddressesReached: string[];
        volume: string;
        transactions: number;
    }> {
        const uniqueAddressesReached = await db.models.beneficiaryTransaction.findAll({
            attributes: [[fn('distinct', col('withAddress')), 'addresses']],
            where: { date }
        }); // this is an array, wich can be empty (return no rows)
        const volumeAndTransactions = (await db.models.beneficiaryTransaction.findAll({
            attributes: [
                [fn('sum', col('amount')), 'volume'],
                [fn('count', col('tx')), 'transactions'],
            ],
            where: { date }
        }))[0] as any; // this is a single result, that, if there's nothing, the result is zero
        // result is { volume: null, transactions: '0' } if nothing has happened
        console.log(volumeAndTransactions);
        return {
            uniqueAddressesReached: uniqueAddressesReached.length === 0 ? [] : uniqueAddressesReached.map((a: any) => a.addresses),
            volume: volumeAndTransactions.volume === null ? '0' : volumeAndTransactions.volume,
            transactions: parseInt(volumeAndTransactions.transactions, 10),
        }
    }
}