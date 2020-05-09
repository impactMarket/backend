import { Transactions } from '../models/transactions';


export default class TransactionsService {
    public static async add(
        tx: string,
        from: string,
        contractAddress: string,
        event: string,
        values: any,
    ) {
        return Transactions.create({
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
}