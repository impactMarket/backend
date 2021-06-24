import { User } from '@interfaces/app/user';
import { IManagerDetailsBeneficiary } from '@ipcttypes/endpoints';
import { Beneficiary, BeneficiaryAttributes } from '@models/ubi/beneficiary';
import { ManagerAttributes } from '@models/ubi/manager';
import { Logger } from '@utils/logger';
import { isAddress } from '@utils/util';
import { Op, fn, col, WhereAttributeHash, literal } from 'sequelize';
import { Literal, Where } from 'sequelize/types/lib/utils';

import { models, sequelize } from '../../database';
import CommunityService from './community';

export default class BeneficiaryService {
    public static beneficiary = models.beneficiary;
    public static manager = models.manager;
    public static appUserTrust = models.appUserTrust;
    public static user = models.user;
    public static community = models.community;
    public static sequelize = sequelize;

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
            await this.beneficiary.create(beneficiaryData);
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
        await this.beneficiary.update(
            { active: false },
            { where: { address, communityId } }
        );
    }

    public static findByAddress(
        address: string,
        active?: boolean
    ): Promise<Beneficiary | null> {
        return this.beneficiary.findOne({
            where: { address, active },
        });
    }

    public static async search(
        managerAddress: string,
        searchInput: string,
        active?: boolean
    ): Promise<IManagerDetailsBeneficiary[]> {
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

        const manager = await this.manager.findOne({
            attributes: ['communityId'],
            where: { address: managerAddress, active: true },
        });
        if (manager === null) {
            return [];
        }
        const communityId = (manager.toJSON() as ManagerAttributes).communityId;
        const x = await this.beneficiary.findAll({
            where: { ...whereActive, communityId },
            include: [
                {
                    model: this.user,
                    as: 'user',
                    where: whereSearchCondition,
                },
            ],
            order,
        });

        if (x === null) {
            return [];
        }
        const result: IManagerDetailsBeneficiary[] = x.map((r) => {
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

    public static listActiveInCommunity(
        communityId: string
    ): Promise<
        { claims: number; lastClaimAt: Date; penultimateClaimAt: Date }[]
    > {
        return this.beneficiary.findAll({
            attributes: ['claims', 'lastClaimAt', 'penultimateClaimAt'],
            where: {
                communityId,
                active: true,
            },
            raw: true,
        }) as any;
    }

    public static async listBeneficiaries(
        managerAddress: string,
        active: boolean,
        offset: number,
        limit: number
    ): Promise<IManagerDetailsBeneficiary[]> {
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

        const manager = await this.manager.findOne({
            attributes: ['communityId'],
            where: { address: managerAddress, active: true },
        });
        if (manager === null) {
            return [];
        }
        const communityId = (manager.toJSON() as ManagerAttributes).communityId;
        const x = await this.beneficiary.findAll({
            where: { active, communityId },
            include: [
                {
                    model: this.user,
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
        const result: IManagerDetailsBeneficiary[] = x.map((r) => {
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
            await this.community.findAll({
                attributes: ['publicId'],
                where: { visibility: 'public', status: 'valid' },
                raw: true,
            })
        ).map((c) => c.publicId);

        return (
            await this.beneficiary.findAll({
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
            await this.beneficiary.findAll({
                attributes: ['address'],
                raw: true,
            })
        ).map((b) => b.address);
    }

    public static async getActiveBeneficiariesLast30Days(): Promise<
        Map<string, number>
    > {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const result = await this.beneficiary.findAll({
            attributes: [[fn('count', col('address')), 'total'], 'communityId'],
            where: {
                lastClaimAt: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                },
            },
            group: 'communityId',
            raw: true,
        });
        return new Map(result.map((c: any) => [c.communityId, c.total]));
    }
}
