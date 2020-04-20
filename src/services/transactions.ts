import { Transactions } from '../models/transactions';


export default class TransactionsService {
    public static async add(
        tx: string,
        type: number,
        from: string,
        to: string,
        amount: string,
    ) {
        return Transactions.create({
            tx,
            type,
            from,
            to,
            amount,
        });
    }

    public static async getAll() {
        return Transactions.findAll();
    }

    public static async get(tx: string) {
        return Transactions.findOne({ where: { tx } });
    }
}