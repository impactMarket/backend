import { SHA3 } from 'sha3';
import { Transactions } from '../models/transactions';


export default class TransactionsService {
    public static async add(
        tx: string,
        from: string,
        contractAddress: string,
        event: string,
        values: any, // values from events can have multiple forms
    ) {
        const hash = new SHA3(256);
        hash.update(tx).update(JSON.stringify(values));
        return Transactions.create({
            uid: hash.digest('hex'),
            tx,
            from,
            contractAddress,
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

    public static async getCommunityBeneficicaries(communityContractAddress: string) {
        // TODO: get only if it was added and not removed yet
        return Transactions.findAll({
            where: {
                event: 'BeneficiaryAdded',
                contractAddress: communityContractAddress
            },
        });
    }

    public static async findComunityToBeneficicary(beneficiaryAddress: string) {
        // TODO: get only if it was added and not removed yet
        return Transactions.findOne({
            where: {
                event: 'BeneficiaryAdded',
                values: { _account: beneficiaryAddress }
            },
        });
    }

    public static async findComunityToManager(managerAddress: string) {
        // TODO: get only if it was added and not removed yet
        return Transactions.findOne({
            where: {
                event: 'CoordinatorAdded',
                values: { _account: managerAddress }
            },
        });
    }

    public static async getLastEntry() {
        const entries = await Transactions.findAll({
            limit: 1,
            where: {
                //your where conditions, or without them if you need ANY entry
            },
            order: [['createdAt', 'DESC']]
        });
        if (entries.length === 0) {
            return undefined;
        }
        return entries[0];
    }
}