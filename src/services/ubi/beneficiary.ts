import { User } from '@interfaces/app/user';
import { IListBeneficiary } from '@ipcttypes/endpoints';
import { Beneficiary, BeneficiaryAttributes } from '@models/ubi/beneficiary';
import { ManagerAttributes } from '@models/ubi/manager';
import { Logger } from '@utils/logger';
import { isAddress } from '@utils/util';
import { Op, WhereAttributeHash, literal } from 'sequelize';
import { Literal, Where } from 'sequelize/types/lib/utils';

import { models } from '../../database';
import CommunityService from './community';

export default class BeneficiaryService {
    public static async add(
        address: string,
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
            await models.beneficiary.create(beneficiaryData);
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
        communityId: string
    ): Promise<void> {
        await models.beneficiary.update(
            { active: false },
            { where: { address, communityId } }
        );
    }

    public static findByAddress(
        address: string,
        active?: boolean
    ): Promise<Beneficiary | null> {
        return models.beneficiary.findOne({
            where: { address, active },
        });
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
                address: searchInput,
            };
        } else if (
            searchInput.toLowerCase().indexOf('drop') === -1 &&
            searchInput.toLowerCase().indexOf('delete') === -1 &&
            searchInput.toLowerCase().indexOf('update') === -1 &&
            searchInput.length < 16
        ) {
            whereSearchCondition = {
                username: { [Op.like]: `%${searchInput}%` },
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

    public static async getAllAddressesInPublicValidCommunities(): Promise<
        string[]
    > {
        // select address from beneficiary b, community c
        // where b."communityId" = c."publicId"
        // and c.status = 'valid'
        // and c.visibility = 'public'
        // and b.active = true
        const publicCommunities: string[] = (
            await models.community.findAll({
                attributes: ['publicId'],
                where: { visibility: 'public', status: 'valid' },
                raw: true,
            })
        ).map((c) => c.publicId);

        return (
            await models.beneficiary.findAll({
                attributes: ['address'],
                where: {
                    communityId: { [Op.in]: publicCommunities },
                    active: true,
                },
                raw: true,
            })
        ).map((b) => b.address);
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (
            await models.beneficiary.findAll({
                attributes: ['address'],
                raw: true,
            })
        ).map((b) => b.address);
    }
}
