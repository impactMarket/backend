import { User } from '@interfaces/app/user';
import {
    UbiBeneficiaryRegistryCreation,
    UbiBeneficiaryRegistryType,
} from '@interfaces/ubi/ubiBeneficiaryRegistry';
import { IListBeneficiary } from '@ipcttypes/endpoints';
import {
    BeneficiaryAttributes,
    IBeneficiaryActivities,
} from '@models/ubi/beneficiary';
import { BeneficiaryTransactionCreationAttributes } from '@models/ubi/beneficiaryTransaction';
import { ManagerAttributes } from '@models/ubi/manager';
import { Logger } from '@utils/logger';
import { isAddress } from '@utils/util';
import { ethers } from 'ethers';
import _ from 'lodash';
import { Op, WhereAttributeHash, literal, QueryTypes } from 'sequelize';
import { Literal, Where } from 'sequelize/types/lib/utils';

import { models, sequelize } from '../../database';
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

    public static async getBeneficiaryActivity(
        managerAddress: string,
        beneficiaryAddress: string,
        offset: number,
        limit: number
    ): Promise<IBeneficiaryActivities[]> {
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
                throw new Error('Manager not found');
            }
            const communityId = (manager.toJSON() as ManagerAttributes)
                .community?.id;

            const query = `SELECT id, 'registry' AS type, tx, "txAt" AS date, "registry"."from" AS "withAddress", activity, null AS "isFromBeneficiary", null AS amount, "user"."username"
                FROM ubi_beneficiary_registry AS "registry" LEFT JOIN "user" AS "user" ON "registry"."from" = "user"."address"
                WHERE "registry"."address" = '${beneficiaryAddress}' AND "registry"."communityId" = ${communityId}
                UNION ALL
                SELECT id, 'transaction' AS type, tx, "transaction"."createdAt" AS date, "withAddress", null as activity, "isFromBeneficiary", amount, "user"."username"
                FROM beneficiarytransaction AS "transaction" LEFT JOIN "user" AS "user" ON "transaction"."withAddress" = "user"."address"
                WHERE "transaction"."beneficiary" = '${beneficiaryAddress}' 
                UNION ALL
                SELECT id, 'claim' AS type, tx, "txAt" AS date, null AS "withAddress", null as activity, null AS "isFromBeneficiary", amount, null AS "username"
                FROM ubi_claim as "claim"
                WHERE "claim"."address" = '${beneficiaryAddress}' AND "claim"."communityId" = ${communityId}
                ORDER BY DATE DESC
                OFFSET ${offset}
                LIMIT ${limit}`;

            return sequelize.query<IBeneficiaryActivities>(query, {
                type: QueryTypes.SELECT,
            });
        } catch (error) {
            throw error;
        }
    }
}
