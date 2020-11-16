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
        const uniqueAddressesReached = ((await BeneficiaryTransaction.findAll({
            attributes: [[fn('distinct', col('withAddress')), 'addresses']],
            where: { date }
        })) as any);
        const volumeAndTransactions = (await BeneficiaryTransaction.findAll({
            attributes: [
                [fn('sum', col('amount')), 'volume'],
                [fn('count', col('tx')), 'transactions'],
            ],
            where: { date }
        }))[0] as any;
        return {
            uniqueAddressesReached: uniqueAddressesReached.length === 0 ? [] : uniqueAddressesReached.addresses,
            volume: volumeAndTransactions.volume === null ? '0' : volumeAndTransactions.volume,
            transactions: volumeAndTransactions.transactions,
        }
    }
}