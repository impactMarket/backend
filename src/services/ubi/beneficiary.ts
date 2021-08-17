import { User } from '@interfaces/app/user';
import {
    UbiBeneficiaryRegistry,
    UbiBeneficiaryRegistryCreation,
    UbiBeneficiaryRegistryType,
} from '@interfaces/ubi/ubiBeneficiaryRegistry';
import { UbiClaim } from '@interfaces/ubi/ubiClaim';
import { IListBeneficiary } from '@ipcttypes/endpoints';
import {
    BeneficiaryAttributes,
    IBeneficiaryWithActivities,
    ActivityType,
} from '@models/ubi/beneficiary';
import {
    BeneficiaryTransactionCreationAttributes,
    BeneficiaryTransactionAttributes,
} from '@models/ubi/beneficiaryTransaction';
import { InflowAttributes } from '@models/ubi/inflow';
import { ManagerAttributes } from '@models/ubi/manager';
import { Logger } from '@utils/logger';
import { isAddress } from '@utils/util';
import { ethers } from 'ethers';
import _ from 'lodash';
import { Op, WhereAttributeHash, literal } from 'sequelize';
import { Literal, Where } from 'sequelize/types/lib/utils';

import { models } from '../../database';
import CommunityService from './community';

export default class BeneficiaryService {
    public static async add(
        address: string,
        from: string,
        communityId: string,
        tx: string,
        txAt: Date
    ): Promise<boolean> {
        const beneficiaryData = {
            address,
            communityId,
            tx,
            txAt,
        };
        try {
            const community = await models.community.findOne({
                attributes: ['id'],
                where: { publicId: communityId },
            });
            await models.beneficiary.create(beneficiaryData);
            await this._addRegistry({
                address,
                from,
                communityId: community!.id,
                activity: UbiBeneficiaryRegistryType.add,
                tx,
                txAt,
            });
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new Beneficiary. Data = ' +
                        JSON.stringify(beneficiaryData)
                );
                Logger.error(e);
            }
        }
        return true;
    }

    public static async remove(
        address: string,
        from: string,
        communityId: string,
        tx: string,
        txAt: Date
    ): Promise<void> {
        const community = await models.community.findOne({
            attributes: ['id'],
            where: { publicId: communityId },
        });
        await models.beneficiary.update(
            { active: false },
            { where: { address, communityId } }
        );
        await this._addRegistry({
            address,
            from,
            communityId: community!.id,
            activity: UbiBeneficiaryRegistryType.remove,
            tx,
            txAt,
        });
    }

    public static async findByAddress(
        address: string,
        active?: boolean
    ): Promise<BeneficiaryAttributes | null> {
        const beneficiary = await models.beneficiary.findOne({
            where: { address, active },
        });
        if (beneficiary) {
            return beneficiary.toJSON() as BeneficiaryAttributes;
        }
        return null;
    }

    public static async search(
        managerAddress: string,
        searchInput: string,
        active?: boolean
    ): Promise<IListBeneficiary[]> {
        let whereSearchCondition: Where | WhereAttributeHash<User>;
        let whereActive: Where | WhereAttributeHash<BeneficiaryAttributes> = {};
        if (!isAddress(managerAddress)) {
            throw new Error('Not valid address!');
        }
        // prevent add community contracts as beneficiaries
        if (
            (await CommunityService.existsByContractAddress(managerAddress)) ===
            true
        ) {
            throw new Error('Not valid address!');
        }
        if (isAddress(searchInput)) {
            whereSearchCondition = {
                address: ethers.utils.getAddress(searchInput),
            };
        } else if (
            searchInput.toLowerCase().indexOf('drop') === -1 &&
            searchInput.toLowerCase().indexOf('delete') === -1 &&
            searchInput.toLowerCase().indexOf('update') === -1
        ) {
            whereSearchCondition = {
                username: { [Op.iLike]: `%${searchInput.slice(0, 16)}%` },
            };
        } else {
            throw new Error('Not valid search!');
        }

        if (active !== undefined) {
            whereActive = { active };
        }

        // const order: OrderItem[] = [
        //     [
        //         [{ model: models.user, as: 'user' }, 'suspect', 'DESC'],
        //         ['txAt', 'DESC'],
        //     ],
        // ];

        const order: Literal = literal('"user".suspect DESC, "txAt" DESC');

        const manager = await models.manager.findOne({
            attributes: ['communityId'],
            where: { address: managerAddress, active: true },
        });
        if (manager === null) {
            return [];
        }
        const communityId = (manager.toJSON() as ManagerAttributes).communityId;
        const x = await models.beneficiary.findAll({
            where: { ...whereActive, communityId },
            include: [
                {
                    model: models.user,
                    as: 'user',
                    where: whereSearchCondition,
                },
            ],
            order,
        });

        if (x === null) {
            return [];
        }
        const result: IListBeneficiary[] = x.map((r) => {
            const b = r.toJSON() as BeneficiaryAttributes;
            return {
                address: b.address,
                username: b.user ? b.user!.username : null,
                timestamp: b.txAt.getTime(),
                claimed: b.claimed,
                blocked: b.blocked,
                suspect: b.user && b.user.suspect,
            };
        });
        return result;
    }

    public static async list(
        managerAddress: string,
        active: boolean,
        offset: number,
        limit: number
    ): Promise<IListBeneficiary[]> {
        if (!isAddress(managerAddress)) {
            throw new Error('Not a manager ' + managerAddress);
        }

        // const order: OrderItem[] = [
        //     [
        //         [{ model: models.user, as: 'user' }, 'suspect', 'DESC'],
        //         ['txAt', 'DESC'],
        //     ],
        // ];

        const order: Literal = literal('"user".suspect DESC, "txAt" DESC');

        const manager = await models.manager.findOne({
            attributes: ['communityId'],
            where: { address: managerAddress, active: true },
        });
        if (manager === null) {
            return [];
        }
        const communityId = (manager.toJSON() as ManagerAttributes).communityId;
        const x = await models.beneficiary.findAll({
            where: { active, communityId },
            include: [
                {
                    model: models.user,
                    as: 'user',
                },
            ],
            order,
            offset,
            limit,
        });
        if (x === null) {
            return [];
        }
        const result: IListBeneficiary[] = x.map((r) => {
            const b = r.toJSON() as BeneficiaryAttributes;
            return {
                address: b.address,
                username: b.user ? b.user!.username : null,
                timestamp: b.txAt.getTime(),
                claimed: b.claimed,
                blocked: b.blocked,
                suspect: b.user && b.user.suspect,
            };
        });
        return result;
    }

    public static async addTransaction(
        beneficiaryTx: BeneficiaryTransactionCreationAttributes
    ): Promise<void> {
        try {
            await models.beneficiaryTransaction.create(beneficiaryTx);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new BeneficiaryTransaction. Data = ' +
                        JSON.stringify(beneficiaryTx)
                );
                Logger.error(e);
            }
        }
    }

    private static async _addRegistry(
        registry: UbiBeneficiaryRegistryCreation
    ): Promise<void> {
        try {
            await models.ubiBeneficiaryRegistry.create(registry);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new BeneficiaryTransaction. Data = ' +
                        JSON.stringify(registry)
                );
                Logger.error(e);
            }
        }
    }

    public static async beneficiaryActivity(
        managerAddress: string,
        beneficiaryAddress: string
    ): Promise<any> {
        try {
            if (!isAddress(managerAddress)) {
                throw new Error('Not valid address!');
            }
            // prevent add community contracts as beneficiaries
            if (
                (await CommunityService.existsByContractAddress(
                    managerAddress
                )) === true
            ) {
                throw new Error('Not valid address!');
            }

            const manager = await models.manager.findOne({
                attributes: ['communityId'],
                where: { address: managerAddress, active: true },
            });
            if (manager === null) {
                throw new Error('Manager not found');
            }
            const communityId = (manager.toJSON() as ManagerAttributes)
                .communityId;
            const community = await models.community.findOne({
                attributes: ['id'],
                where: {
                    publicId: communityId,
                },
            });

            const beneficiary = await models.beneficiary.findOne({
                where: {
                    address: beneficiaryAddress,
                    communityId,
                },
                include: [
                    {
                        model: models.user,
                        as: 'user',
                    },
                    {
                        model: models.beneficiaryTransaction,
                        as: 'transactions',
                        include: [
                            {
                                model: models.user,
                                as: 'user',
                            },
                        ],
                    },
                    {
                        model: models.ubiClaim,
                        as: 'claim',
                    },
                ],
            });

            if (!beneficiary) {
                throw new Error('Beneficiary not found');
            }

            const beneficiaryRegistry =
                await models.ubiBeneficiaryRegistry.findAll({
                    include: [
                        {
                            model: models.user,
                            as: 'user',
                        },
                    ],
                    where: {
                        address: beneficiaryAddress,
                        communityId: community?.id,
                    },
                });

            const inflow = await models.inflow.findAll({
                where: {
                    from: beneficiaryAddress,
                },
            });

            const formatedBeneficiary = this.formatActivity({
                ...(beneficiary.toJSON() as BeneficiaryAttributes),
                registry: beneficiaryRegistry,
                inflow,
            });

            return formatedBeneficiary;
        } catch (error) {
            throw error;
        }
    }

    private static formatActivity(
        beneficiary: BeneficiaryAttributes & {
            transactions?: BeneficiaryTransactionAttributes[];
            claim?: UbiClaim[];
            registry?: UbiBeneficiaryRegistry[];
            inflow?: InflowAttributes[];
        }
    ): IBeneficiaryWithActivities {
        const activity: ActivityType[] = [];
        Object.keys(beneficiary).forEach((key) => {
            switch (key) {
                case 'transactions':
                    const transactions = beneficiary[key]?.map(
                        (el: BeneficiaryTransactionAttributes) => ({
                            id: el.id,
                            type: key,
                            tx: el.tx,
                            date: new Date(el.date),
                            withAddress: el.withAddress,
                            user: el.user,
                            isFromBeneficiary: el.isFromBeneficiary,
                            amount: el.amount,
                        })
                    );
                    if (transactions && transactions.length) {
                        activity.push(...transactions);
                    }
                    delete beneficiary[key];
                    break;
                case 'claim':
                    const claim = beneficiary[key]?.map((el: UbiClaim) => ({
                        id: el.id,
                        type: key,
                        tx: el.tx,
                        date: new Date(el.txAt),
                        amount: el.amount,
                    }));
                    if (claim && claim.length) {
                        activity.push(...claim);
                    }
                    delete beneficiary[key];
                    break;
                case 'registry':
                    const registry = beneficiary[key]?.map(
                        (el: UbiBeneficiaryRegistry) => ({
                            id: el.id,
                            type: key,
                            tx: el.tx,
                            date: new Date(el.txAt),
                            withAddress: el.address,
                            user: el.user,
                            activity: el.activity,
                        })
                    );
                    if (registry && registry.length) {
                        activity.push(...registry);
                    }
                    delete beneficiary[key];
                    break;
                case 'inflow':
                    const inflow = beneficiary[key]?.map(
                        (el: InflowAttributes) => ({
                            id: el.id,
                            type: key,
                            tx: el.tx,
                            date: new Date(el.txAt),
                            amount: el.amount,
                        })
                    );
                    if (inflow && inflow.length) {
                        activity.push(...inflow);
                    }
                    delete beneficiary[key];
                    break;
                default:
                    break;
            }
        });

        return {
            ...beneficiary,
            activity: _.orderBy(activity, 'date', 'desc'),
        };
    }
}
