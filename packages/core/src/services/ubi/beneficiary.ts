import { ethers } from 'ethers';
import { Op, WhereAttributeHash, literal, QueryTypes } from 'sequelize';
import { Literal, Where } from 'sequelize/types/lib/utils';

import config from '../../config';
import { models, sequelize } from '../../database';
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
import { getUserActivity } from '../../subgraph/queries/user';

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

    public static async getTotalBeneficiaries(address: string): Promise<{
        suspicious: number;
        inactive: number;
    }> {
        const manager = await models.manager.findOne({
            attributes: ['communityId'],
            where: {
                address,
            },
        });

        if (!manager || !manager.communityId) {
            throw new BaseError('NOT_MANAGER', 'Not a manager ' + address);
        }

        const suspicious = await models.beneficiary.count({
            include: [
                {
                    attributes: ['suspect'],
                    model: models.appUser,
                    as: 'user',
                },
            ],
            where: {
                communityId: manager.communityId,
                '$"user"."suspect"$': true,
            } as any,
        });

        const inactive = await models.beneficiary.count({
            where: {
                communityId: manager.communityId,
                active: false,
            },
        });

        return {
            suspicious,
            inactive,
        };
    }

    public static async search(
        managerAddress: string,
        searchInput: string,
        filter?: BeneficiaryFilterType
    ): Promise<IListBeneficiary[]> {
        let whereSearchCondition: Where | WhereAttributeHash<AppUser> = {};
        let whereBeneficiary:
            | Where
            | WhereAttributeHash<BeneficiaryAttributes> = {};
        let required: boolean;

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
        if (isAddress(searchInput)) {
            whereBeneficiary = {
                address: ethers.utils.getAddress(searchInput),
            };
            required = false;
        } else if (
            searchInput.toLowerCase().indexOf('drop') === -1 &&
            searchInput.toLowerCase().indexOf('delete') === -1 &&
            searchInput.toLowerCase().indexOf('update') === -1
        ) {
            whereSearchCondition = {
                username: { [Op.iLike]: `%${searchInput.slice(0, 16)}%` },
            };
            required = true;
        } else {
            throw new BaseError('INVALID_SEARCH', 'Not valid search!');
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

        if (filter) {
            const beneficiaryFilter = await this.getBeneficiaryFilter(
                filter,
                communityId
            );
            whereBeneficiary = {
                ...beneficiaryFilter,
                ...whereBeneficiary,
            };
        }

        const x = await models.beneficiary.findAll({
            where: {
                ...whereBeneficiary,
                communityId,
            },
            include: [
                {
                    model: models.appUser,
                    as: 'user',
                    where: whereSearchCondition,
                    required,
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
                isDeleted: !b.user || !!b.user!.deletedAt,
            };
        });
        return result;
    }

    public static async list(
        managerAddress: string,
        offset: number,
        limit: number,
        filter: BeneficiaryFilterType
    ): Promise<IListBeneficiary[]> {
        if (!isAddress(managerAddress)) {
            throw new BaseError(
                'NOT_MANAGER',
                'Not a manager ' + managerAddress
            );
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

        const where = await this.getBeneficiaryFilter(filter, communityId);

        const x = await models.beneficiary.findAll({
            where: {
                communityId,
                ...where,
            },
            include: [
                {
                    model: models.appUser,
                    as: 'user',
                    required: false,
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
                isDeleted: !b.user || !!b.user!.deletedAt,
            };
        });
        return result;
    }

    public static async getBeneficiaryFilter(
        filter: BeneficiaryFilterType,
        communityId: number
    ) {
        let where = {};

        if (filter.active !== undefined) {
            where = {
                ...where,
                active: filter.active,
            };
        }

        if (filter.suspect) {
            where = {
                ...where,
                '$"user"."suspect"$': filter.suspect,
            };
        }

        if (filter.unidentified) {
            where = {
                ...where,
                '$"user"."username"$': null,
            };
        }

        if (filter.blocked) {
            where = {
                ...where,
                blocked: filter.blocked,
            };
        }

        if (filter.inactivity) {
            const communityContract = await models.community.findOne({
                attributes: [],
                include: [
                    {
                        attributes: ['baseInterval'],
                        model: models.ubiCommunityContract,
                        as: 'contract',
                    },
                ],
                where: {
                    id: communityId,
                },
            });

            const seconds =
                (communityContract as any).contract.baseInterval *
                config.claimInactivityThreshold;
            const lastClaimAt = new Date();
            lastClaimAt.setSeconds(lastClaimAt.getSeconds() - seconds);
            where = {
                ...where,
                lastClaimAt: {
                    [Op.lte]: lastClaimAt,
                },
            };
        }

        if (filter.loginInactivity) {
            const date = new Date();
            date.setDate(date.getDate() - config.loginInactivityThreshold);

            where = {
                ...where,
                '$"user"."lastLogin"$': {
                    [Op.lt]: date,
                },
            };
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
            }
        });
        const registry = await getUserActivity(beneficiaryAddress, community!.contractAddress!, offset, limit);
        const user = await models.appUser.findOne({
            where: {
                address: beneficiaryAddress,
            }
        });
        return registry.map((el) => ({
            id: el.id as any,
            type: 'registry',
            tx: el.id,
            txAt: new Date(el.timestamp * 1000),
            withAddress: el.by,
            username: user ? user.username! : undefined,
            activity: BeneficiaryActivity[el.activity],
        }));
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
        const registry = await this.getRegistryActivity(beneficiaryAddress, communityId);
        const transaction = await this.getTransactionActivity(beneficiaryAddress, communityId);
        const claim = await this.getClaimActivity(beneficiaryAddress, communityId);

        const activitiesOrdered = [...registry, ...transaction, ...claim].sort((a, b) => b.txAt.getTime() - a.txAt.getTime());
        
        return activitiesOrdered.slice(offset, offset + limit);
    }

    public static async readRules(address: string): Promise<boolean> {
        try {
            const updated = await models.beneficiary.update(
                {
                    readRules: true,
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
