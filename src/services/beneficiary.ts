import { IManagerDetailsBeneficiary } from '@ipcttypes/endpoints';
import { Beneficiary } from '@models/beneficiary';
import { Logger } from '@utils/logger';
import { isUUID, isAddress } from '@utils/util';
import { Op, fn, col, QueryTypes } from 'sequelize';

import { models, sequelize } from '../database';
import CommunityService from './community';

// const db = database();
export default class BeneficiaryService {
    public static beneficiary = models.beneficiary;
    public static community = models.community;
    public static sequelize = sequelize;

    public static async add(
        address: string,
        communityId: string,
        tx: string,
        txAt: Date
    ): Promise<boolean> {
        // if user does not exist, add to pending list
        // otherwise update
        const user = await this.beneficiary.findOne({
            where: { address, active: false },
            raw: true,
        });
        if (user === null) {
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
        } else {
            await this.beneficiary.update(
                { active: true },
                { where: { address } }
            );
        }
        return true;
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
        active: boolean
    ): Promise<IManagerDetailsBeneficiary[]> {
        // select b.address, u.username, b."txAt" "timestamp", COALESCE(sum(c.amount), 0) claimed
        // from beneficiary b
        //     left join "user" u on b.address = u.address
        //     left join claim c on b.address = c.address
        //     left join manager m on b."communityId" = m."communityId"
        // where m."user" = '0x833961aab38d24EECdCD2129Aa5a5d41Fd86Acbf'
        // and b.active = true and b.address = '0x64771E37aA6cD3AeD0660fee96F6651CE4d1E3a5'
        // group by b.address, u.username, b."txAt"
        // order by b."txAt" desc

        let query = '';
        if (!isAddress(managerAddress)) {
            throw new Error('Not valid address!');
        }
        if (
            (await CommunityService.existsByContractAddress(managerAddress)) ===
            true
        ) {
            throw new Error('Not valid address!');
        }
        if (isAddress(searchInput)) {
            query =
                'select b.address, u.username, b."txAt" "timestamp", COALESCE(sum(c.amount), 0) claimed from beneficiary b left join "user" u on b.address = u.address left join claim c on b.address = c.address left join manager m on b."communityId" = m."communityId" where m."user" = \'' +
                managerAddress +
                "' and b.active = " +
                active +
                " and b.address = '" +
                searchInput +
                '\' group by b.address, u.username, b."txAt" order by b."txAt" desc';
        } else if (
            searchInput.toLowerCase().indexOf('drop') === -1 &&
            searchInput.toLowerCase().indexOf('delete') === -1 &&
            searchInput.toLowerCase().indexOf('update') === -1 &&
            searchInput.length < 16
        ) {
            query =
                'select b.address, u.username, b."txAt" "timestamp", COALESCE(sum(c.amount), 0) claimed from beneficiary b left join "user" u on b.address = u.address left join claim c on b.address = c.address left join manager m on b."communityId" = m."communityId" where m."user" = \'' +
                managerAddress +
                "' and b.active = " +
                active +
                " and u.username like '%" +
                searchInput +
                '%\' group by b.address, u.username, b."txAt" order by b."txAt" desc';
        } else {
            throw new Error('Not valid search!');
        }
        return await this.sequelize.query(query, { type: QueryTypes.SELECT });
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

        return await this.sequelize.query(
            'select b.address, u.username, b."txAt" "timestamp", COALESCE(sum(c.amount), 0) claimed from beneficiary b left join "user" u on b.address = u.address left join claim c on b.address = c.address left join manager m on b."communityId" = m."communityId" where m."user" = \'' +
                managerAddress +
                "' and b.active = " +
                active +
                ' group by b.address, u.username, b."txAt" order by b."txAt" desc offset ' +
                offset +
                ' limit ' +
                limit,
            { type: QueryTypes.SELECT }
        );
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

    public static async get(address: string): Promise<Beneficiary | null> {
        return await this.beneficiary.findOne({
            where: { address, active: true },
            raw: true,
        });
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
