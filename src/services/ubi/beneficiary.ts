import { User } from '@interfaces/app/user';
import { IManagerDetailsBeneficiary } from '@ipcttypes/endpoints';
import { Beneficiary, BeneficiaryAttributes } from '@models/ubi/beneficiary';
import { Logger } from '@utils/logger';
import { isUUID, isAddress } from '@utils/util';
import {
    Op,
    fn,
    col,
    QueryTypes,
    OrderItem,
    WhereAttributeHash,
} from 'sequelize';
import { Col, Fn, Literal, Where } from 'sequelize/types/lib/utils';

import { models, sequelize } from '../../database';
import CommunityService from './community';

// const db = database();
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

    public static findByAddress(
        address: string,
        active?: boolean
    ): Promise<Beneficiary | null> {
        return this.beneficiary.findOne({
            where: { address, active },
        });
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

        const order: string | Literal | Fn | Col | OrderItem[] | undefined = [
            ['user', 'throughTrust', 'suspect', 'DESC'],
        ]; // it's default order for now.

        const x = await this.beneficiary.findAll({
            where: whereActive,
            include: [
                {
                    model: this.manager,
                    as: 'manager',
                    where: {
                        user: managerAddress,
                    },
                },
                {
                    model: this.user,
                    as: 'user',
                    where: whereSearchCondition,
                    include: [
                        {
                            model: this.appUserTrust,
                            as: 'throughTrust',
                            include: [
                                {
                                    model: this.appUserTrust,
                                    as: 'selfTrust',
                                },
                            ],
                        },
                    ],
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
                verifiedPN:
                    b.user &&
                    b.user.throughTrust &&
                    b.user.throughTrust.length > 0
                        ? b.user.throughTrust[0].verifiedPhoneNumber
                        : undefined,
                suspect:
                    b.user &&
                    b.user.throughTrust &&
                    b.user.throughTrust.length > 0
                        ? b.user.throughTrust[0].selfTrust
                            ? (b.user.throughTrust[0].selfTrust &&
                                  b.user.throughTrust[0].selfTrust.length >
                                      1) ||
                              b.user.throughTrust[0].suspect
                            : undefined
                        : undefined,
            };
        });
        return result;
    }

    public static async listBeneficiaries(
        managerAddress: string,
        active: boolean,
        offset: number,
        limit: number
    ): Promise<IManagerDetailsBeneficiary[]> {
        // sequelize still has a bug related to eager loading when using global raw:false

        // select b.address, u.username, b."txAt" "timestamp", COALESCE(sum(c.amount), 0) claimed
        // from beneficiary b
        //     left join "user" u on b.address = u.address
        //     left join claim c on b.address = c.address
        //     left join manager m on b."communityId" = m."communityId"
        // where m."user" = '0x833961aab38d24EECdCD2129Aa5a5d41Fd86Acbf'
        // group by b.address, u.username, b."txAt"
        // order by b."txAt" desc
        // offset 0
        // limit 10

        if (!isAddress(managerAddress)) {
            throw new Error('Not a manager ' + managerAddress);
        }

        const order: string | Literal | Fn | Col | OrderItem[] | undefined = [
            ['user', 'throughTrust', 'suspect', 'DESC'],
        ]; // it's default order for now.

        const x = await this.beneficiary.findAll({
            where: { active },
            include: [
                {
                    model: this.manager,
                    as: 'manager',
                    where: {
                        user: managerAddress,
                    },
                },
                {
                    model: this.user,
                    as: 'user',
                    include: [
                        {
                            model: this.appUserTrust,
                            as: 'throughTrust',
                            include: [
                                {
                                    model: this.appUserTrust,
                                    as: 'selfTrust',
                                },
                            ],
                        },
                    ],
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
                verifiedPN:
                    b.user &&
                    b.user.throughTrust &&
                    b.user.throughTrust.length > 0
                        ? b.user.throughTrust[0].verifiedPhoneNumber
                        : undefined,
                suspect:
                    b.user &&
                    b.user.throughTrust &&
                    b.user.throughTrust.length > 0
                        ? b.user.throughTrust[0].selfTrust
                            ? (b.user.throughTrust[0].selfTrust &&
                                  b.user.throughTrust[0].selfTrust.length >
                                      1) ||
                              b.user.throughTrust[0].suspect
                            : undefined
                        : undefined,
            };
        });
        return result;
    }

    /**
     * @deprecated Since mobile version 0.1.8
     */
    public static async countInCommunity(
        communityId: string
    ): Promise<{ active: number; inactive: number }> {
        const active: { total: string } = (
            await this.beneficiary.findAll({
                attributes: [[fn('count', col('address')), 'total']],
                where: {
                    communityId,
                    active: true,
                },
                raw: true,
            })
        )[0] as any;
        const inactive: { total: string } = (
            await this.beneficiary.findAll({
                attributes: [[fn('count', col('address')), 'total']],
                where: {
                    communityId,
                    active: false,
                },
                raw: true,
            })
        )[0] as any;
        return {
            active: parseInt(active.total, 10),
            inactive: parseInt(inactive.total, 10),
        };
    }

    /**
     * @deprecated Since mobile version 0.1.8
     */
    public static async listAllInCommunity(
        communityId: string
    ): Promise<{
        active: IManagerDetailsBeneficiary[];
        inactive: IManagerDetailsBeneficiary[];
    }> {
        // sequelize still has a bug related to eager loading when using global raw:false

        // select b.address, u.username, b."txAt" "timestamp", COALESCE(sum(c.amount), 0) claimed
        // from beneficiary b
        //     left join "user" u on b.address = u.address
        //     left join claim c on b.address = c.address
        // where b."communityId" = 'ca16d975-4a11-4cdc-baa9-91442c534125'
        // group by b.address, u.username, b."txAt"
        // order by b."txAt" desc

        if (!isUUID(communityId)) {
            throw new Error('Not valid UUID ' + communityId);
        }

        const active: IManagerDetailsBeneficiary[] = await this.sequelize.query(
            'select b.address, u.username, b."txAt" "timestamp", COALESCE(sum(c.amount), 0) claimed from beneficiary b left join "user" u on b.address = u.address left join claim c on b.address = c.address where b."communityId" = \'' +
                communityId +
                '\' and b.active = true group by b.address, u.username, b."txAt" order by b."txAt" desc',
            { type: QueryTypes.SELECT }
        );

        const inactive: IManagerDetailsBeneficiary[] = await this.sequelize.query(
            'select b.address, u.username, b."txAt" "timestamp", COALESCE(sum(c.amount), 0) claimed from beneficiary b left join "user" u on b.address = u.address left join claim c on b.address = c.address where b."communityId" = \'' +
                communityId +
                '\' and b.active = false group by b.address, u.username, b."txAt" order by b."txAt" desc',
            { type: QueryTypes.SELECT }
        );

        return {
            active,
            inactive,
        };
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (
            await this.beneficiary.findAll({
                attributes: ['address'],
                raw: true,
            })
        ).map((b) => b.address);
    }

    public static async remove(address: string): Promise<void> {
        await this.beneficiary.update(
            { active: false },
            { where: { address } }
        );
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
