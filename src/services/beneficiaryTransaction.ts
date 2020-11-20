import { col, fn } from 'sequelize';
import { BeneficiaryTransaction, IBeneficiaryTransaction } from '../db/models/beneficiaryTransaction';


export default class BeneficiaryTransactionService {

    public static async add(beneficiaryTx: IBeneficiaryTransaction): Promise<void> {
        await BeneficiaryTransaction.create(beneficiaryTx);
        return;
    }

    public static async getAllByDay(date: Date): Promise<{
        uniqueAddressesReached: string[];
        volume: string;
        transactions: number;
    }> {
        const uniqueAddressesReached = await BeneficiaryTransaction.findAll({
            attributes: [[fn('distinct', col('withAddress')), 'addresses']],
            where: { date }
        }); // this is an array, wich can be empty (return no rows)
        const volumeAndTransactions = (await BeneficiaryTransaction.findAll({
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