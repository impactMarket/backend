import { col, fn } from 'sequelize';
import { BeneficiaryTransaction } from '../db/models/beneficiaryTransaction';


export default class BeneficiaryTransactionService {

    public static async add(
        beneficiary: string,
        withAddress: string,
        amount: string,
        isFromBeneficiary: boolean,
        tx: string,
        date: Date,
    ): Promise<any> {
        return BeneficiaryTransaction.create({
            beneficiary,
            withAddress,
            amount,
            isFromBeneficiary,
            tx,
            date
        });
    }

    public static async getAllByDay(date: Date): Promise<{
        uniqueAddressesReached: string[];
        volume: string;
        transactions: number;
    }> {
        const uniqueAddressesReached = ((await BeneficiaryTransaction.findAll({
            attributes: [[fn('unique', col('withAddress')), 'addresses']],
            where: { date }
        }))[0] as any).addresses;
        const volumeAndTransactions = (await BeneficiaryTransaction.findAll({
            attributes: [
                [fn('sum', col('amount')), 'volume'],
                [fn('count', col('tx')), 'transactions'],
            ],
            where: { date }
        }))[0] as any;
        return {
            uniqueAddressesReached,
            volume: volumeAndTransactions.volume,
            transactions: volumeAndTransactions.transactions,
        }
    }
}