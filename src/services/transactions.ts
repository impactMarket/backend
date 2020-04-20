import { Transactions } from '../models/transactions';


export default class TransactionsService {
    public static async add(
        tx: string,
        from: string,
        event: string,
        values: any,
    ) {
        return Transactions.create({
            tx,
            from,
            event,
            values,
        });
    }

    public static async getAll() {
        return Transactions.findAll();
    }

    public static async get(account: string) {
        return Transactions.findAll({ where: { values: { _account: account } } });
    }
}