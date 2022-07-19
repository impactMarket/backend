import { ethers } from 'ethers';
import { Op, WhereAttributeHash, literal } from 'sequelize';
import { Where } from 'sequelize/types/lib/utils';

import config from '../../config';
import { models } from '../../database';
import { ManagerAttributes } from '../../database/models/ubi/manager';
import { AppUser } from '../../interfaces/app/appUser';
import { BeneficiaryAttributes } from '../../interfaces/ubi/beneficiary';
import {
    UbiBeneficiaryRegistryCreation,
    UbiBeneficiaryRegistryType,
} from '../../interfaces/ubi/ubiBeneficiaryRegistry';
import {
    UbiBeneficiarySurvey,
    UbiBeneficiarySurveyCreation,
} from '../../interfaces/ubi/ubiBeneficiarySurvey';
import { UbiBeneficiaryTransactionCreation } from '../../interfaces/ubi/ubiBeneficiaryTransaction';
import {
    getBeneficiaries,
    getBeneficiariesByAddress,
} from '../../subgraph/queries/beneficiary';
import { getCommunityState } from '../../subgraph/queries/community';
import { getUserActivity } from '../../subgraph/queries/user';
import { BaseError } from '../../utils/baseError';
import { Logger } from '../../utils/logger';
import { isAddress } from '../../utils/util';
import {
    IBeneficiaryActivities,
    IListBeneficiary,
    BeneficiaryFilterType,
    BeneficiaryActivity,
} from '../endpoints';
import CommunityService from './community';

export default class BeneficiaryService {
    public static async add(
        address: string,
        from: string,
        communityId: number,
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
            await models.beneficiary.create(beneficiaryData);
            await this._addRegistry({
                address,
                from,
                communityId,
                activity: UbiBeneficiaryRegistryType.add,
                tx,
                txAt,
            });
            const maxClaim: any = literal(`"maxClaim" - "decreaseStep"`);
            await models.ubiCommunityContract.update(
                {
                    maxClaim,
                },
                {
                    where: {
                        communityId,
                    },
                }
            );
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
        communityId: number,
        tx: string,
        txAt: Date
    ): Promise<void> {
        await models.beneficiary.update(
            { active: false },
            { where: { address, communityId } }
        );
        await this._addRegistry({
            address,
            from,
            communityId,
            activity: UbiBeneficiaryRegistryType.remove,
            tx,
            txAt,
        });
        const maxClaim: any = literal(`"maxClaim" + "decreaseStep"`);
        await models.ubiCommunityContract.update(
            {
                maxClaim,
            },
            {
                where: {
                    communityId,
                },
            }
        );
    }

    public static async getTotalBeneficiaries(address: string): Promise<{
        suspicious: number;
        inactive: number;
    }> {
        const manager: ManagerAttributes | null = await models.manager.findOne({
            attributes: [],
            include: [
                {
                    attributes: ['contractAddress'],
                    model: models.community,
                    as: 'community',
                },
            ],
            where: {
                address,
            },
        });

        if (
            !manager ||
            !manager.community ||
            !manager.community.contractAddress
        ) {
            throw new BaseError('NOT_MANAGER', 'Not a manager ' + address);
        }

        const communityState = await getCommunityState(
            manager.community.contractAddress
        );

        return {
            suspicious: 0,
            inactive: communityState.removedBeneficiaries,
        };
    }

    public static async search(
        managerAddress: string,
        searchInput: string,
        filter?: BeneficiaryFilterType
    ): Promise<IListBeneficiary[]> {
        let whereSearchCondition: Where | WhereAttributeHash<AppUser> | null =
            null;

        if (!isAddress(managerAddress)) {
            throw new BaseError('INVALID_ADDRESS', 'Not valid address!');
        }
        // prevent add community contracts as beneficiaries
        if (
            (await CommunityService.existsByContractAddress(managerAddress)) ===
            true
        ) {
            throw new BaseError('INVALID_ADDRESS', 'Not valid address!');
        }

        const manager = await models.manager.findOne({
            attributes: ['communityId'],
            where: { address: managerAddress, active: true },
        });
        if (manager === null) {
            return [];
        }
        const communityId = (manager.toJSON() as ManagerAttributes).communityId;
        const community = await models.community.findOne({
            attributes: ['contractAddress'],
            where: {
                id: communityId,
            },
        });

        const addresses: string[] = [];

        if (isAddress(searchInput)) {
            addresses.push(ethers.utils.getAddress(searchInput));
        } else if (
            searchInput.toLowerCase().indexOf('drop') === -1 &&
            searchInput.toLowerCase().indexOf('delete') === -1 &&
            searchInput.toLowerCase().indexOf('update') === -1
        ) {
            whereSearchCondition = {
                username: { [Op.iLike]: `%${searchInput.slice(0, 16)}%` },
            };
        } else {
            throw new BaseError('INVALID_SEARCH', 'Not valid search!');
        }

        const userFilter = filter ? await this.getUserFilter(filter) : {};
        whereSearchCondition = {
            ...whereSearchCondition,
            ...userFilter,
        };

        const beneficiaryFilter = await this.getBeneficiaryFilter(
            filter ? filter : {},
            communityId
        );

        const appUsers = await models.appUser.findAll({
            where: {
                ...whereSearchCondition,
                ...(addresses.length > 0
                    ? {
                          address: {
                              [Op.in]: addresses,
                          },
                      }
                    : {}),
            },
        });

        if (appUsers && appUsers.length > 0) {
            appUsers.forEach((user) => addresses.push(user.address));
        }

        const beneficiaries = await getBeneficiariesByAddress(
            addresses,
            beneficiaryFilter.state,
            beneficiaryFilter.inactive,
            community!.contractAddress!
        );

        const result: IListBeneficiary[] = beneficiaries.map(
            (beneficiary: any) => {
                const user = appUsers.find(
                    (user) => beneficiary.address === user.address.toLowerCase()
                );
                return {
                    address: ethers.utils.getAddress(beneficiary.address),
                    username: user?.username,
                    timestamp: beneficiary.since * 1000,
                    claimed: beneficiary.claimed,
                    blocked: beneficiary.state === 2,
                    suspect: user?.suspect,
                    isDeleted: !user || !!user.deletedAt,
                };
            }
        );
        return result;
    }

    public static async list(
        managerAddress: string,
        offset: number,
        limit: number,
        filter: BeneficiaryFilterType
    ): Promise<IListBeneficiary[]> {
        let whereSearchCondition: Where | WhereAttributeHash<AppUser> | null =
            null;

        if (!isAddress(managerAddress)) {
            throw new BaseError(
                'NOT_MANAGER',
                'Not a manager ' + managerAddress
            );
        }

        const manager = await models.manager.findOne({
            attributes: ['communityId'],
            where: { address: managerAddress, active: true },
        });
        if (manager === null) {
            return [];
        }
        const communityId = (manager.toJSON() as ManagerAttributes).communityId;
        const community = await models.community.findOne({
            attributes: ['contractAddress'],
            where: {
                id: communityId,
            },
        });

        whereSearchCondition = await this.getUserFilter(filter!);

        const beneficiaryFilter = await this.getBeneficiaryFilter(
            filter!,
            communityId
        );

        const beneficiaries = await getBeneficiaries(
            community!.contractAddress!,
            limit,
            offset,
            beneficiaryFilter.inactive,
            beneficiaryFilter.state
        );

        const addresses = beneficiaries.map((beneficiary) =>
            ethers.utils.getAddress(beneficiary.address)
        );

        const appUsers = await models.appUser.findAll({
            where: {
                address: {
                    [Op.in]: addresses,
                },
                ...whereSearchCondition,
            },
        });

        const result: IListBeneficiary[] = [];
        if (Object.keys(whereSearchCondition).length > 0) {
            appUsers.forEach((user: any) => {
                const beneficiary = beneficiaries.find(
                    (beneficiary) =>
                        beneficiary.address === user.address.toLowerCase()
                );
                if (beneficiary) {
                    result.push({
                        address: user.address,
                        username: user?.username,
                        timestamp: beneficiary.since
                            ? beneficiary.since * 1000
                            : 0,
                        claimed: beneficiary.claimed,
                        blocked: beneficiary.state === 2,
                        suspect: user?.suspect,
                        isDeleted: !!user.deletedAt,
                    } as any);
                }
            });
        } else {
            beneficiaries.forEach((beneficiary: any) => {
                const user = appUsers.find(
                    (user) => beneficiary.address === user.address.toLowerCase()
                );
                result.push({
                    address: ethers.utils.getAddress(beneficiary.address),
                    username: user?.username,
                    timestamp: beneficiary.since * 1000,
                    claimed: beneficiary.claimed,
                    blocked: beneficiary.state === 2,
                    suspect: user?.suspect,
                    isDeleted: !user || !!user.deletedAt,
                } as any);
            });
        }
        return result;
    }

    public static async getUserFilter(filter: BeneficiaryFilterType) {
        let where = {};

        if (filter.unidentified !== undefined) {
            where = {
                ...where,
                username: filter.unidentified ? null : { [Op.not]: null },
            };
        }

        if (filter.loginInactivity) {
            const date = new Date();
            date.setDate(date.getDate() - config.loginInactivityThreshold);

            where = {
                ...where,
                lastLogin: {
                    [Op.lt]: date,
                },
            };
        }

        return where;
    }

    public static async getBeneficiaryFilter(
        filter: BeneficiaryFilterType,
        communityId: number
    ) {
        const where = {
            state: '',
            inactive: '',
        };

        if (filter.active !== undefined) {
            where.state = `state: ${filter.active ? 0 : 1}`;
        } else if (filter.blocked) {
            where.state = 'state: 2';
        }

        if (filter.inactivity) {
            const communityContract = await models.ubiCommunityContract.findOne(
                {
                    attributes: ['baseInterval'],
                    where: {
                        communityId,
                    },
                }
            );

            const seconds =
                communityContract!.baseInterval *
                config.claimInactivityThreshold;
            const lastClaimAt = new Date();
            lastClaimAt.setSeconds(lastClaimAt.getSeconds() - seconds);
            where.inactive += `lastClaimAt_lte: ${lastClaimAt}`;
        }

        return where;
    }

    public static async addTransaction(
        beneficiaryTx: UbiBeneficiaryTransactionCreation
    ): Promise<void> {
        try {
            await models.ubiBeneficiaryTransaction.create(beneficiaryTx);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new UbiBeneficiaryTransaction. Data = ' +
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
                    'Error inserting new UbiBeneficiaryTransaction. Data = ' +
                        JSON.stringify(registry)
                );
                Logger.error(e);
            }
        }
    }

    public static async getBeneficiaryActivity(
        managerAddress: string,
        beneficiaryAddress: string,
        type: string,
        offset: number,
        limit: number
    ): Promise<IBeneficiaryActivities[]> {
        try {
            if (!isAddress(managerAddress)) {
                throw new BaseError('INVALID_ADDRESS', 'Not valid address!');
            }
            // prevent add community contracts as beneficiaries
            if (
                (await CommunityService.existsByContractAddress(
                    managerAddress
                )) === true
            ) {
                throw new BaseError('INVALID_ADDRESS', 'Not valid address!');
            }

            const manager = await models.manager.findOne({
                attributes: [],
                include: [
                    {
                        model: models.community,
                        as: 'community',
                        attributes: ['id'],
                    },
                ],
                where: { address: managerAddress, active: true },
            });
            if (manager === null) {
                throw new BaseError('MANAGER_NOT_FOUND', 'Manager not found');
            }
            const communityId = (manager.toJSON() as ManagerAttributes)
                .community?.id;

            if (!communityId) {
                throw new BaseError(
                    'COMMUNITY_NOT_FOUND',
                    'Community not found'
                );
            }

            switch (type.toUpperCase()) {
                case 'CLAIM':
                    return this.getClaimActivity(
                        beneficiaryAddress,
                        communityId,
                        offset,
                        limit
                    );
                case 'REGISTRY':
                    return this.getRegistryActivity(
                        beneficiaryAddress,
                        communityId,
                        offset,
                        limit
                    );
                case 'TRANSACTION':
                    return this.getTransactionActivity(
                        beneficiaryAddress,
                        communityId,
                        offset,
                        limit
                    );
                default:
                    return this.getAllActivity(
                        beneficiaryAddress,
                        communityId,
                        offset,
                        limit
                    );
            }
        } catch (error) {
            throw error;
        }
    }

    private static async getClaimActivity(
        beneficiaryAddress: string,
        communityId: number,
        offset?: number,
        limit?: number
    ): Promise<IBeneficiaryActivities[]> {
        const claims = await models.ubiClaim.findAll({
            where: {
                address: beneficiaryAddress,
                communityId,
            },
            order: [['txAt', 'DESC']],
            limit,
            offset,
        });
        return claims.map((claim) => ({
            id: claim.id,
            type: 'claim',
            tx: claim.tx,
            txAt: claim.txAt,
            amount: claim.amount,
        }));
    }

    private static async getRegistryActivity(
        beneficiaryAddress: string,
        communityId: number,
        offset?: number,
        limit?: number
    ): Promise<IBeneficiaryActivities[]> {
        const community = await models.community.findOne({
            attributes: ['contractAddress'],
            where: {
                id: communityId,
            },
        });
        const registry = await getUserActivity(
            beneficiaryAddress,
            community!.contractAddress!,
            offset,
            limit
        );
        const users = await models.appUser.findAll({
            attributes: ['username', 'address'],
            where: {
                address: {
                    [Op.in]: registry.map((el) =>
                        ethers.utils.getAddress(el.by)
                    ),
                },
            },
        });

        return registry.map((el) => {
            const user = users.find(
                (user) => user.address === ethers.utils.getAddress(el.by)
            );
            return {
                id: el.id as any,
                type: 'registry',
                tx: el.id,
                txAt: new Date(el.timestamp * 1000),
                withAddress: el.by,
                username: user ? user.username! : undefined,
                activity: BeneficiaryActivity[el.activity],
            };
        });
    }

    private static async getTransactionActivity(
        beneficiaryAddress: string,
        communityId: number,
        offset?: number,
        limit?: number
    ): Promise<IBeneficiaryActivities[]> {
        const transactions = await models.ubiBeneficiaryTransaction.findAll({
            where: {
                beneficiary: beneficiaryAddress,
            },
            include: [
                {
                    attributes: ['username'],
                    model: models.appUser,
                    as: 'user',
                },
            ],
            order: [['txAt', 'DESC']],
            limit,
            offset,
        });
        return transactions.map((transaction) => ({
            id: transaction.id,
            type: 'transaction',
            tx: transaction.tx,
            txAt: transaction.txAt,
            withAddress: transaction.withAddress,
            username: transaction['user']
                ? transaction['user']['username']
                : null,
            amount: transaction.amount,
            isFromBeneficiary: transaction.isFromBeneficiary,
        }));
    }

    private static async getAllActivity(
        beneficiaryAddress: string,
        communityId: number,
        offset: number,
        limit: number
    ): Promise<IBeneficiaryActivities[]> {
        const registry = await this.getRegistryActivity(
            beneficiaryAddress,
            communityId
        );
        const transaction = await this.getTransactionActivity(
            beneficiaryAddress,
            communityId
        );
        const claim = await this.getClaimActivity(
            beneficiaryAddress,
            communityId
        );

        const activitiesOrdered = [...registry, ...transaction, ...claim].sort(
            (a, b) => b.txAt.getTime() - a.txAt.getTime()
        );

        return activitiesOrdered.slice(offset, offset + limit);
    }

    public static async readRules(address: string): Promise<boolean> {
        try {
            const updated = await models.appUser.update(
                {
                    readBeneficiaryRules: true,
                },
                {
                    where: { address },
                }
            );

            if (updated[0] === 0) {
                throw new BaseError(
                    'UPDATE_FAILED',
                    'Beneficiary was not updated'
                );
            }
            return true;
        } catch (error) {
            throw new BaseError('UPDATE_FAILED', 'Beneficiary was not updated');
        }
    }

    public static async saveSurvery(
        address: string,
        survey: UbiBeneficiarySurveyCreation[]
    ): Promise<UbiBeneficiarySurvey[]> {
        try {
            const user = await models.appUser.findOne({
                attributes: ['id'],
                where: { address },
            });

            if (!user) {
                throw new BaseError('USER_NOT_FOUND', 'User not found');
            }

            survey.forEach((element) => {
                element.userId = user.id;
            });

            return models.ubiBeneficiarySurvey.bulkCreate(survey);
        } catch (error) {
            throw error;
        }
    }
}
