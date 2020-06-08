import { SHA3 } from 'sha3';
import { Transactions } from '../models/transactions';
import BigNumber from 'bignumber.js';
import { ICommunityVars, IRecentTxListItem } from '../types';
import config from '../config';
import axios from 'axios';
import { Op } from 'sequelize';
import CommunityService from './community';
import { ethers } from 'ethers';
import { Username } from '../models/username';
import UsernameService from './username';


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
        if (reqResult.length === 0) {
            return undefined;
        }
        if (reqResult[0].event === 'BeneficiaryRemoved') {
            return undefined;
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
        const dbRequestResult = await Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: {
                    [Op.or]: [
                        'BeneficiaryAdded',
                        'BeneficiaryRemoved',
                    ]
                },
            }
        });
        const beneficiaries = dbRequestResult.map((beneficiary) => ({
            account: beneficiary.values._account,
            event: beneficiary.event,
            timestamp: beneficiary.createdAt.getTime(),
        }));
        // group
        const result = {
            added: [],
            removed: [],
        } as { added: string[], removed: string[] };
        for (let [k, v] of this.groupBy(beneficiaries, 'account')) {
            const event = v.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
            if (event.event === 'BeneficiaryAdded') {
                result.added.push(event.account);
            } else {
                result.removed.push(event.account);
            }
        }
        return result;
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
        if (vars.length === 0) {
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

    public static async paymentsTx(userAddress: string) {
        const query = await axios.get(
            `${config.baseBlockScoutApiUrl}?module=account&action=tokentx&address=${userAddress}`
        );
        const decimals = new BigNumber(10).pow(config.cUSDDecimal);

        const result = query.data.result
            .filter((r: { logIndex: string; from: string; }) => r.logIndex === '0' && r.from.toLowerCase() === userAddress.toLowerCase())
            .map((r: { to: string; value: string; tokenDecimal: string; timeStamp: string; }) => ({ to: ethers.utils.getAddress(r.to), value: new BigNumber(r.value).div(decimals).toFixed(2), timestamp: parseInt(r.timeStamp, 10) }));
        // https://dev.to/marinamosti/removing-duplicates-in-an-array-of-objects-in-js-with-sets-3fep
        return Array.from(new Set(result.map((a: { to: string; }) => a.to))).map(to => result.find((a: { to: string; }) => a.to === to));
    }

    public static async tokenTx(userAddress: string) {
        /**
         { value: '0',
        txreceipt_status: '1',
        transactionIndex: '0',
        to: '0xedee42319ebf455ed42f8c42a7ddc6febdb752ea',
        timeStamp: '1591465626',
        nonce: '37',
        isError: '0',
        input:
        '0x5926651d000000000000000000000000382ae9478dbdc7afc7bb786729c617f38bc94319',
        hash:
        '0x08bf33d2d91065e9e0e3cf36644191faba7c532dbfa6cb2ddca7f58cbf2be1a8',
        gasUsed: '90552',
        gasPrice: '50000000000',
        gas: '135828',
        from: '0x60f2b1ee6322b3aa2c88f497d87f65a15593f452',
        cumulativeGasUsed: '90552',
        contractAddress: '',
        confirmations: '2790',
        blockNumber: '938981',
        blockHash:
        '0xdb5344fb76467c23b6d6c2e5c36258a0c43cad7281e756060b8b81501843e6e5' }
         */
        const results = await axios.get(
            `${config.baseBlockScoutApiUrl}?module=account&action=txlist&address=${userAddress}`
        );

        const chooseAddress = (tx: { to: string, from: string, input: string }) => {
            if (tx.to.toLowerCase() === config.cUSDContractAddress.toLowerCase()) return '0x' + tx.input.substr(34, 40)
            return (tx.from.toLowerCase() === userAddress.toLowerCase()) ? tx.to : tx.from;
        }

        // filter necessary
        const rawTxs = results.data.result
            .map((result: { from: string, to: string, input: string, timeStamp: string }) => ({
                from: ethers.utils.getAddress(result.from),
                to: ethers.utils.getAddress(result.to),
                input: result.input,
                timestamp: parseInt(result.timeStamp, 10)
            })) as { from: string, to: string, input: string, timestamp: number }[];

        const txs = rawTxs.map((tx) => ({
            timestamp: tx.timestamp,
            address: chooseAddress(tx),
        })).sort((a, b) => b.timestamp - a.timestamp) as { timestamp: number, address: string }[];

        // group
        const result: IRecentTxListItem[] = [];
        const communities = await CommunityService.getNamesAndFromAddresses(txs.map((e) => e.address));
        const hasCommunities = communities !== undefined && communities.length > 0;
        //
        for (let [k, v] of this.groupBy(txs, 'address')) {
            let community = communities.find((e) => e.contractAddress === k)
            result.push({
                from: (hasCommunities && community !== undefined) ? community.name : k,
                txs: v.length,
                timestamp: v[0].timestamp
            });
        }
        return result.slice(0, Math.min(10, result.length));
    }

    private static async addressesByNames(addresses: string[]) {
        const communities = await CommunityService.getNamesAndFromAddresses(addresses);
        const usernames = await UsernameService.getAll();
        // const hasCommunities = communities !== undefined && communities.length > 0;

        return addresses.map((a) => {
            let community = communities.find((e) => e.contractAddress === a);
            let user = usernames.find((e) => e.address === a);
            return community !== undefined ? community.name : (user !== undefined ? user.username : a);
        });
    }

    // Accepts the array and key
    private static groupBy(array: any[], key: string): Map<string, any[]> {
        // Return the end result
        return array.reduce((result, currentValue) => {
            let content = result.get(currentValue[key]);
            // If an array already present for key, push it to the array. Else create an array and push the object
            (content === undefined) ? content = [currentValue] : content.push(currentValue);
            // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
            return result.set(currentValue[key], content);
        }, new Map<string, any[]>()); // empty map is the initial value for result object
    };
}