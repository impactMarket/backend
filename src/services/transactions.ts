import { SHA3 } from 'sha3';
import { Transactions } from '../models/transactions';
import BigNumber from 'bignumber.js';
import { ICommunityVars, IRecentTxListItem } from '../types';
import config from '../config';
import axios from 'axios';
import { Op } from 'sequelize';


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

    public static async findComunityToBeneficicary(beneficiaryAddress: string) {
        const reqResult = await Transactions.findAll({
            limit: 1,
            where: {
                event: {
                    [Op.or]: [
                        'BeneficiaryAdded',
                        'BeneficiaryRemoved'
                    ],
                },
                values: { _account: beneficiaryAddress },
            },
            order: [['createdAt', 'DESC']]
        });
        if (reqResult === null) {
            return null;
        }
        if (reqResult[0].event === 'BeneficiaryRemoved') {
            return null;
        }
        return reqResult[0];
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

    public static async getBeneficiariesInCommunity(communityAddress: string) {
        const dbRequest = Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: 'BeneficiaryAdded',
            }
        });
        const beneficiaries = (await dbRequest)
            .map((beneficiary) => beneficiary.values._account as string);
        return beneficiaries;
    }

    public static async getCommunityManagersInCommunity(communityAddress: string): Promise<string[]> {
        const dbRequest = Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: 'CoordinatorAdded',
            }
        });
        const managers = (await dbRequest)
            .map((manager) => manager.values._account as string);
        return managers;
    }

    public static async getBackersInCommunity(communityAddress: string) {
        const dbRequest = Transactions.findAll({
            where: {
                event: 'Transfer',
                values: { to: communityAddress }
            }
        });
        const backers = (await dbRequest)
            .map((backer) => backer.values.from as string);
        // Because Set only lets you store unique values.
        return [...new Set(backers)];
    }

    public static async getCommunityVars(communityAddress: string): Promise<ICommunityVars> {
        const vars = await Transactions.findAll({
            limit: 1,
            where: {
                [Op.or]: [
                    {
                        event: 'CommunityAdded',
                        values: { _communityAddress: communityAddress }
                    },
                    {
                        event: 'CommunityEdited',
                        contractAddress: communityAddress
                    },
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        if (vars === null) {
            return {} as any;
        }
        return {
            _amountByClaim: vars[0].values._amountByClaim,
            _baseIntervalTime: vars[0].values._baseIntervalTime,
            _incIntervalTime: vars[0].values._incIntervalTime,
            _claimHardCap: vars[0].values._claimHardCap
        };
    }

    public static async getCommunityRaisedAmount(communityAddress: string): Promise<string> {
        const donations = await Transactions.findAll({
            where: {
                event: 'Transfer',
                values: { to: communityAddress }
            }
        });
        let raised = new BigNumber(0);
        donations.forEach((donation) => raised = raised.plus(donation.values.value));
        return raised.toString();
    }

    public static async getCommunityClaimedAmount(communityAddress: string): Promise<string> {
        const claims = await Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: 'BeneficiaryClaim',
            }
        });
        let claimed = new BigNumber(0);
        claims.forEach((claim) => claimed = claimed.plus(claim.values._amount));
        return claimed.toString();
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

    public static async tokenTx(userAddress: string) {
        const results = await axios.get(
            `${config.baseBlockScoutApiUrl}?module=account&action=tokentx&address=${userAddress}`);
        // filter necessary
        const rawTxs: { from: string, to: string, timestamp: number }[] = results
            .data.result.map((result: any) => (
                { from: result.from, to: result.to, timestamp: parseInt(result.timeStamp, 10) }
            )).slice(0, 20);
        let txs: { timestamp: number, address: string }[] = rawTxs.map((tx) => {
            if (tx.from.toLowerCase() === userAddress.toLowerCase()) {
                return { timestamp: tx.timestamp, address: tx.to }
            }
            return { timestamp: tx.timestamp, address: tx.from }
        })
        // sort
        txs = txs.sort((a, b) => a.timestamp - b.timestamp);
        // group
        const result: IRecentTxListItem[] = [];
        const groupedTxs = txs.reduce((r, a) => {
            r[a.address] = r[a.address] || [];
            r[a.address].push(a);
            return r;
        }, Object.create(null));
        const gTxs = Object.keys(groupedTxs);
        for (let index = 0; index < gTxs.length; index++) {
            const element = gTxs[index];
            result.push(
                { from: element, txs: groupedTxs[element].length, timestamp: groupedTxs[element][0].timestamp }
            );
        }
        return result.slice(0, Math.min(5, result.length));
    }
}