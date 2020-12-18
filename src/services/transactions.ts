import axios from 'axios';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { LogDescription } from 'ethers/lib/utils';
import _ from 'lodash';
import moment from 'moment';
import { Op, fn, literal, Sequelize } from 'sequelize';
import { SHA3 } from 'sha3';

import config from '../config';
import { Community } from '../db/models/community';
import { Transactions } from '../db/models/transactions';
import {
    ICommunityVars,
    IRecentTxAPI,
    IPaymentsTxAPI,
    IUserTxAPI,
    IGlobalStatus,
    IGlobalOutflowStatus,
    IGlobalInflowStatus,
    ICommunityInfoBeneficiary,
} from '../types';
import { groupBy } from '../utils';
import CommunityService from './community';
import UserService from './user';

interface ICommunityAddedEventValues {
    _communityAddress: string;
    _firstManager: string;
    _claimAmount: BigNumber;
    _maxClaim: BigNumber;
    _baseInterval: BigNumber;
    _incrementInterval: BigNumber;
}
interface ICommunityEditedEventValues {
    _claimAmount: BigNumber;
    _maxClaim: BigNumber;
    _baseInterval: BigNumber;
    _incrementInterval: BigNumber;
}
interface IBeneficiaryClaimEventValues {
    _account: string;
    _amount: BigNumber;
}
interface ITransferEventValues {
    from: string;
    to: string;
    value: BigNumber;
}

export function translateEvent(
    rawValues:
        | ICommunityAddedEventValues
        | ICommunityEditedEventValues
        | IBeneficiaryClaimEventValues
        | ITransferEventValues
        | { _account: string }
): any {
    if ((rawValues as ICommunityAddedEventValues)._firstManager) {
        const values = rawValues as ICommunityAddedEventValues;
        return {
            _communityAddress: values._communityAddress,
            _firstManager: values._firstManager,
            _claimAmount: values._claimAmount.toString(),
            _maxClaim: values._maxClaim.toString(),
            _baseInterval: values._baseInterval.toString(),
            _incrementInterval: values._incrementInterval.toString(),
        };
    } else if ((rawValues as ITransferEventValues).from) {
        const values = rawValues as ITransferEventValues;
        return {
            from: values.from,
            to: values.to,
            value: values.value.toString(),
        };
    } else if ((rawValues as IBeneficiaryClaimEventValues)._amount) {
        const values = rawValues as IBeneficiaryClaimEventValues;
        return {
            _account: values._account,
            _amount: values._amount.toString(),
        };
    } else if ((rawValues as ICommunityEditedEventValues)._claimAmount) {
        const values = rawValues as ICommunityEditedEventValues;
        return {
            _claimAmount: values._claimAmount.toString(),
            _maxClaim: values._maxClaim.toString(),
            _baseInterval: values._baseInterval.toString(),
            _incrementInterval: values._incrementInterval.toString(),
        };
    }
    // everything else
    const values = rawValues as { _account: string };
    return {
        _account: values._account,
    };
}

export default class TransactionsService {
    /**
     * @deprecated
     */
    public static async add(
        provider: ethers.providers.JsonRpcProvider,
        logs: ethers.providers.Log,
        events: LogDescription
    ): Promise<Transactions> {
        const tx = logs.transactionHash!;
        const txReceipt = await provider.getTransactionReceipt(tx);
        const from = txReceipt.from!;
        // const block = await provider.getBlock(txReceipt.blockHash!);
        const contractAddress = logs.address;
        const event = events.name;
        const values = translateEvent(events.args as any);

        return this.addRaw(
            tx,
            new Date(),
            from,
            contractAddress,
            event,
            values
        );
    }

    /**
     * @deprecated
     */
    public static async addRaw(
        tx: string,
        txAt: Date,
        from: string,
        contractAddress: string,
        event: string,
        values: unknown // values from events can have multiple forms
    ): Promise<Transactions> {
        const hash = new SHA3(256);
        hash.update(tx).update(JSON.stringify(values));
        return Transactions.create({
            uid: hash.digest('hex'),
            tx,
            txAt,
            from,
            contractAddress,
            event,
            values,
        });
    }

    /**
     * @deprecated
     */
    public static async getAll(): Promise<Transactions[]> {
        return Transactions.findAll();
    }

    /**
     * @deprecated
     */
    public static async findComunityToBeneficicary(
        beneficiaryAddress: string
    ): Promise<Transactions | undefined> {
        const reqResult = await Transactions.findAll({
            limit: 1,
            where: {
                event: {
                    [Op.or]: ['BeneficiaryAdded', 'BeneficiaryRemoved'],
                },
                values: { _account: beneficiaryAddress },
            },
            order: [['createdAt', 'DESC']],
        });
        if (reqResult.length === 0) {
            return undefined;
        }
        if (reqResult[0].event === 'BeneficiaryRemoved') {
            return undefined;
        }
        return reqResult[0];
    }

    /**
     * @deprecated
     */
    public static async findComunityToManager(
        managerAddress: string
    ): Promise<Transactions | null> {
        // TODO: get only if it was added and not removed yet
        return Transactions.findOne({
            where: {
                event: 'ManagerAdded',
                values: { _account: managerAddress },
            },
        });
    }

    /**
     * @deprecated
     */
    public static async getBeneficiariesInCommunity(
        communityAddress: string
    ): Promise<{
        added: ICommunityInfoBeneficiary[];
        removed: ICommunityInfoBeneficiary[];
    }> {
        const dbRequestResult = await Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: {
                    [Op.or]: ['BeneficiaryAdded', 'BeneficiaryRemoved'],
                },
            },
            order: [['txAt', 'DESC']],
        });
        const beneficiaries = dbRequestResult.map((beneficiary) => ({
            account: beneficiary.values._account,
            event: beneficiary.event,
            timestamp: beneficiary.txAt.getTime(),
        }));
        // group
        const result = { added: [], removed: [] } as {
            added: ICommunityInfoBeneficiary[];
            removed: ICommunityInfoBeneficiary[];
        };
        const claimed = await TransactionsService.getBeneficiariesCommunityClaimedAmount(
            communityAddress
        );
        const registry = await this.addressesByNames();
        for (const [, v] of groupBy<any>(beneficiaries, 'account')) {
            const event = v.sort(
                (a: any, b: any) => b.timestamp - a.timestamp
            )[0];
            if (event.event === 'BeneficiaryAdded') {
                result.added.push({
                    ...this.addressToAddressAndName(event.account, registry),
                    timestamp: event.timestamp,
                    claimed: claimed.get(event.account)!,
                });
            } else {
                result.removed.push({
                    ...this.addressToAddressAndName(event.account, registry),
                    timestamp: event.timestamp,
                    claimed: claimed.get(event.account)!,
                });
            }
        }
        return result;
    }

    /**
     * @deprecated
     */
    public static async getCommunityManagersInCommunity(
        communityAddress: string
    ): Promise<string[]> {
        const dbRequest = Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: 'ManagerAdded',
            },
        });
        const managers = (await dbRequest).map(
            (manager) => manager.values._account as string
        );
        return managers;
    }

    /**
     * @deprecated
     */
    public static async getBackersInCommunity(
        communityAddress: string
    ): Promise<string[]> {
        const dbRequest = Transactions.findAll({
            where: {
                event: 'Transfer',
                values: { to: communityAddress },
            },
        });
        const backers = (await dbRequest).map(
            (backer) => backer.values.from as string
        );
        // Because Set only lets you store unique values.
        return [...new Set(backers)];
    }

    /**
     * @deprecated
     */
    public static async getCommunityVars(
        communityAddress: string
    ): Promise<ICommunityVars> {
        const vars = await Transactions.findAll({
            limit: 1,
            where: {
                [Op.or]: [
                    {
                        event: 'CommunityAdded',
                        values: { _communityAddress: communityAddress },
                    },
                    {
                        event: 'CommunityEdited',
                        contractAddress: communityAddress,
                    },
                ],
            },
            order: [['createdAt', 'DESC']],
        });
        if (vars.length === 0) {
            return {} as any;
        }
        return {
            _claimAmount: vars[0].values._claimAmount,
            _maxClaim: vars[0].values._maxClaim,
            _baseInterval: vars[0].values._baseInterval,
            _incrementInterval: vars[0].values._incrementInterval,
        };
    }

    /**
     * @deprecated
     */
    public static async getCommunityRaisedAmount(
        communityAddress: string
    ): Promise<string> {
        const donations = await Transactions.findAll({
            where: {
                event: 'Transfer',
                values: { to: communityAddress },
            },
        });
        let raised = new BigNumber(0);
        donations.forEach(
            (donation) => (raised = raised.plus(donation.values.value))
        );
        return raised.toString();
    }

    /**
     * @deprecated
     */
    public static async getCommunityClaimedAmount(
        communityAddress: string
    ): Promise<string> {
        const claims = await Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: 'BeneficiaryClaim',
            },
        });
        let claimed = new BigNumber(0);
        claims.forEach(
            (claim) => (claimed = claimed.plus(claim.values._amount))
        );
        return claimed.toString();
    }

    /**
     * @deprecated
     */
    public static async getBeneficiariesCommunityClaimedAmount(
        communityAddress: string
    ): Promise<Map<string, string>> {
        const claims = await Transactions.findAll({
            // attributes: ['from', [fn('sum', literal("values->>'_amount'")), 'claimed']], // cant be used because _amount is a string
            where: {
                contractAddress: communityAddress,
                event: 'BeneficiaryClaim',
            },
            // group: 'from'
            raw: true,
        });
        const result: Map<string, string> = new Map();

        for (const [k, v] of groupBy<any>(claims, 'from')) {
            const sumResult = v
                .map((vv) => vv.values._amount)
                .reduce((a, b) => a.plus(b), new BigNumber(0));
            result.set(k, sumResult.toString());
        }

        return result;
    }

    /**
     * @deprecated
     */
    public static async getBeneficiariesCommunityClaims(
        communityAddress: string
    ): Promise<Map<string, number>> {
        const claims = await Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: 'BeneficiaryClaim',
            },
            raw: true,
        });
        const result: Map<string, number> = new Map();

        for (const [k, v] of groupBy<any>(claims, 'from')) {
            result.set(k, v.length);
        }

        return result;
    }

    /**
     * @deprecated
     */
    public static async getBeneficiariesLastClaim(
        beneficiaryAddress: string
    ): Promise<Transactions[] | undefined> {
        const claim = await Transactions.findAll({
            where: {
                from: beneficiaryAddress,
                event: 'BeneficiaryClaim',
            },
            order: [['txAt', 'DESC']],
            limit: 2,
            raw: true,
        });
        if (claim.length < 2) {
            return undefined;
        }
        return claim;
    }

    /**
     * @deprecated
     */
    public static async getLastClaim(
        communityAddress: string /*, startDate: Date = new Date(new Date().getTime() - 86400000), endDate: Date = new Date() */
    ): Promise<Transactions | undefined> {
        const tx = await Transactions.findAll({
            where: {
                contractAddress: communityAddress,
                event: 'BeneficiaryClaim',
                // txAt: {
                //     [Op.between]: [startDate.getTime(), endDate.getTime()]
                // },
            },
            order: [['txAt', 'DESC']],
            limit: 1,
            raw: true,
        });
        if (tx.length === 0) {
            return undefined;
        }
        return tx[0];
    }

    /**
     * @deprecated
     */
    public static async getLastEntry(): Promise<Transactions | undefined> {
        const entries = await Transactions.findAll({
            limit: 1,
            where: {
                //your where conditions, or without them if you need ANY entry
            },
            order: [['createdAt', 'DESC']],
        });
        if (entries.length === 0) {
            return undefined;
        }
        return entries[0];
    }

    /**
     * @deprecated
     */
    public static async userTx(userAddress: string): Promise<IUserTxAPI[]> {
        const query = await axios.get(
            `${config.baseBlockScoutApiUrl}?module=account&action=tokentx&address=${userAddress}`
        );
        // if there's an empty request
        if (query.data.result.length === 0) {
            return [];
        }
        const registry = await this.addressesByNames();

        const rawResult: {
            to: string;
            from: string;
            value: string;
            tokenDecimal: string;
            timeStamp: string;
        }[] = query.data.result.filter((r: { value: string }) =>
            new BigNumber(r.value).gt('9999999999999999')
        ); // >0,009

        const result: IUserTxAPI[] = [];
        for (let index = 0; index < rawResult.length; index++) {
            const r = rawResult[index];
            const fromUser = ethers.utils.getAddress(r.from) === userAddress;
            const k = fromUser
                ? ethers.utils.getAddress(r.to)
                : ethers.utils.getAddress(r.from);
            result.push({
                picture: await this.findPicture(k),
                counterParty: this.addressToAddressAndName(k, registry),
                value: r.value.toString(),
                timestamp: parseInt(r.timeStamp, 10),
                fromUser,
            });
        }
        // https://dev.to/marinamosti/removing-duplicates-in-an-array-of-objects-in-js-with-sets-3fep
        return result; // Array.from(new Set(result.map((a) => a.to.address))).map(address => result.find((a) => a.to.address === address)!);
    }

    /**
     * @deprecated
     */
    public static async paymentsTx(
        userAddress: string
    ): Promise<IPaymentsTxAPI[]> {
        const query = await axios.get(
            `${config.baseBlockScoutApiUrl}?module=account&action=tokentx&address=${userAddress}`
        );
        // if there's an empty request
        if (query.data.result.length === 0) {
            return [];
        }
        const registry = await this.addressesByNames();

        const rawResult: {
            to: string;
            value: string;
            tokenDecimal: string;
            timeStamp: string;
        }[] = query.data.result.filter(
            (r: { logIndex: string; from: string }) =>
                r.logIndex === '0' &&
                r.from.toLowerCase() === userAddress.toLowerCase()
        );

        const result: IPaymentsTxAPI[] = [];
        for (let index = 0; index < rawResult.length; index++) {
            const r = rawResult[index];
            const k = ethers.utils.getAddress(r.to);
            result.push({
                picture: await this.findPicture(k),
                to: this.addressToAddressAndName(k, registry),
                value: r.value.toString(),
                timestamp: parseInt(r.timeStamp, 10),
            });
        }
        // https://dev.to/marinamosti/removing-duplicates-in-an-array-of-objects-in-js-with-sets-3fep
        return Array.from(new Set(result.map((a) => a.to.address))).map(
            (address) => result.find((a) => a.to.address === address)!
        );
    }

    /**
     * @deprecated
     */
    public static async tokenTx(userAddress: string): Promise<IRecentTxAPI[]> {
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
        const query = await axios.get(
            `${config.baseBlockScoutApiUrl}?module=account&action=tokentx&address=${userAddress}`
        );
        // if there's an empty request
        if (query.data.result.length === 0) {
            return [];
        }
        const registry = await this.addressesByNames();

        const rawResult: {
            to: string;
            from: string;
            value: string;
            tokenDecimal: string;
            timeStamp: string;
        }[] = query.data.result.filter(
            (r: { logIndex: string; from: string }) => r.logIndex === '0'
        );

        const result: IRecentTxAPI[] = [];
        for (let index = 0; index < rawResult.length; index++) {
            const r = rawResult[index];
            const k =
                ethers.utils.getAddress(r.to) === userAddress
                    ? ethers.utils.getAddress(r.from)
                    : ethers.utils.getAddress(r.to);
            result.push({
                picture: await this.findPicture(k),
                from: this.addressToAddressAndName(k, registry),
                value: r.value.toString(),
                timestamp: parseInt(r.timeStamp, 10),
            });
        }

        // // group
        // const result: IRecentTxAPI[] = [];
        // const registry = await this.addressesByNames();
        // //
        // for (const [k, v] of groupBy<any>(txs, 'address')) {
        //     result.push({
        //         from: this.addressToAddressAndName(k, registry),
        //         txs: v.length,
        //         timestamp: v[0].timestamp
        //     });
        // }
        return result;
    }

    /**
     * @deprecated
     */
    public static async findUserPrivateCommunity(
        userAddress: string
    ): Promise<Transactions | null> {
        const privateCommunities: string[] = (
            await Community.findAll({
                attributes: ['contractAddress'],
                where: { visibility: 'private' },
            })
        ).map((c) => c.contractAddress!);
        const userEvents = await Transactions.findAll({
            // attributes: ['event'],
            where: {
                event: {
                    [Op.or]: [
                        'BeneficiaryAdded',
                        'BeneficiaryRemoved',
                        'ManagerAdded',
                        'ManagerRemoved',
                    ],
                },
                values: { _account: userAddress },
                contractAddress: {
                    [Op.in]: privateCommunities,
                },
            },
            limit: 1,
            order: [['txAt', 'DESC']],
            raw: true,
        });

        if (userEvents.length === 0) {
            return null;
        }
        if (
            userEvents[0].event === 'BeneficiaryRemoved' ||
            userEvents[0].event === 'ManagerRemoved'
        ) {
            // not in any private community
            return null;
        }
        return userEvents[0];
    }

    /**
     * @deprecated
     */
    public static async getGlobalStatus(): Promise<IGlobalStatus> {
        const privateCommunities: string[] = (
            await Community.findAll({
                attributes: ['contractAddress'],
                where: { visibility: 'private' },
            })
        ).map((c) => c.contractAddress!);
        //
        const raised = await Transactions.findAll({
            where: {
                event: 'Transfer',
                values: {
                    to: { [Op.notIn]: privateCommunities },
                },
            },
            raw: true,
        });
        const totalRaised = raised
            .map((donation) => donation.values.value)
            .reduce((a, b) => a.plus(b), new BigNumber(0));
        const distributed = await Transactions.findAll({
            where: {
                event: 'BeneficiaryClaim',
                contractAddress: { [Op.notIn]: privateCommunities },
            },
            raw: true,
        });
        const totalDistributed = distributed
            .map((claim) => claim.values._amount)
            .reduce((a, b) => a.plus(b), new BigNumber(0));
        // select distinct(values->>'_account') as account, max("txAt") as by_day from public.transactions where event = 'BeneficiaryAdded' group by (values->>'_account');
        // select count(distinct(t."values")) as total from transactions t, community c where c."contractAddress" = t."contractAddress" and t."event" = 'BeneficiaryAdded' and t."values" not in (select t1."values" from transactions t1 where t1."event" = 'BeneficiaryRemoved') and c.visibility = 'public'
        const notBeneficiary = (
            await Transactions.findAll({
                attributes: [
                    [
                        Sequelize.fn(
                            'DISTINCT',
                            Sequelize.json('values._account')
                        ),
                        'account',
                    ],
                ],
                where: {
                    event: 'BeneficiaryRemoved',
                    contractAddress: { [Op.notIn]: privateCommunities },
                },
                raw: true,
            })
        ).map((tx: any) => tx.account);
        const beneficiaries = ((
            await Transactions.findAll({
                attributes: [
                    [
                        Sequelize.fn(
                            'COUNT',
                            Sequelize.fn(
                                'DISTINCT',
                                Sequelize.json('values._account')
                            )
                        ),
                        'total',
                    ],
                ],
                where: {
                    event: 'BeneficiaryAdded',
                    contractAddress: { [Op.notIn]: privateCommunities },
                    values: { _account: { [Op.notIn]: notBeneficiary } },
                },
                raw: true,
            })
        )[0] as any).total;
        return {
            totalRaised: totalRaised.toString(),
            totalDistributed: totalDistributed.toString(),
            totalBeneficiaries: beneficiaries.toString(),
            totalClaims: distributed.length.toString(),
        };
    }

    /**
     * @deprecated
     */
    public static async getOutflowStatus(): Promise<IGlobalOutflowStatus> {
        const privateCommunities: string[] = (
            await Community.findAll({
                attributes: ['contractAddress'],
                where: { visibility: 'private' },
            })
        ).map((c) => c.contractAddress!);
        //
        const distributed = await Transactions.findAll({
            where: {
                event: 'BeneficiaryClaim',
                contractAddress: { [Op.notIn]: privateCommunities },
            },
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('txAt')), 'by_day'],
                'values',
            ],
            // order: [[Sequelize.fn('DATE', Sequelize.col('txAt')), 'ASC']],
            raw: true,
        });

        const notBeneficiary = (
            await Transactions.findAll({
                attributes: [
                    [
                        Sequelize.fn(
                            'DISTINCT',
                            Sequelize.json('values._account')
                        ),
                        'account',
                    ],
                ],
                where: {
                    event: 'BeneficiaryRemoved',
                    contractAddress: { [Op.notIn]: privateCommunities },
                },
                raw: true,
            })
        ).map((tx: any) => tx.account);
        // select date_trunc('day', t."createdAt"), count(distinct(t."values")) from transactions t, community c where c."contractAddress" = t."contractAddress" and t."event" = 'BeneficiaryAdded' and t."values" not in (select t1."values" from transactions t1 where t1."event" = 'BeneficiaryRemoved') and c.visibility = 'public' group by 1
        const beneficiaries = await Transactions.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'by_day'],
                [
                    Sequelize.fn(
                        'COUNT',
                        Sequelize.fn(
                            'DISTINCT',
                            Sequelize.json('values._account')
                        )
                    ),
                    'total',
                ],
                // [Sequelize.fn('DISTINCT', Sequelize.json('values._account')), 'account'],
            ],
            where: {
                event: 'BeneficiaryAdded',
                contractAddress: { [Op.notIn]: privateCommunities },
                values: { _account: { [Op.notIn]: notBeneficiary } },
            },
            group: ['by_day'],
            raw: true,
        });
        const dayNumber = (item: { by_day: string }) =>
            new Date(item.by_day).getTime();
        return {
            claims: _.groupBy(distributed, dayNumber),
            beneficiaries: _.groupBy(beneficiaries, dayNumber),
        };
    }

    /**
     * @deprecated
     */
    public static async getInflowStatus(): Promise<IGlobalInflowStatus> {
        const publicCommunities: string[] = (
            await Community.findAll({
                attributes: ['contractAddress'],
                where: { visibility: 'public' },
            })
        ).map((c) => c.contractAddress!);

        const raised = await Transactions.findAll({
            where: {
                event: 'Transfer',
                values: { to: { [Op.in]: publicCommunities } },
            },
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('txAt')), 'by_day'],
                'values',
            ],
            raw: true,
        });

        const dayNumber = (item: { by_day: string }) =>
            new Date(item.by_day).getTime();
        return {
            raises: _.groupBy(raised, dayNumber),
            rate: {},
        };
    }

    /**
     * @deprecated
     */
    private static async addressesByNames() {
        const communities = await CommunityService.mappedNames();
        const usernames = await UserService.mappedNames();
        return new Map([...communities, ...usernames]); // addresses.map((a) => registry.has(a) !== undefined ? registry.get(a) : a);
    }

    /**
     * @deprecated
     */
    private static addressToAddressAndName(
        address: string,
        registry: Map<string, string>
    ) {
        const addressFromRegistry = registry.get(address);
        return {
            address,
            name:
                addressFromRegistry === null ||
                addressFromRegistry === undefined
                    ? ''
                    : addressFromRegistry,
        };
    }

    /**
     * @deprecated
     */
    private static async findPicture(address: string) {
        const user = await UserService.get(address);
        let picture;
        if (user !== null) {
            picture = user.avatar;
        } else {
            const community = await CommunityService.findByContractAddress(
                address
            );
            if (community !== null) {
                picture = community.coverImage;
            }
        }
        return picture;
    }
}
