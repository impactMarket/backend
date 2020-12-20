import { Op, fn, col, QueryTypes } from 'sequelize';
import { Beneficiary } from '../db/models/beneficiary';
import database from '../loaders/database';
import { Logger } from '../loaders/logger';
import { IManagerDetailsBeneficiary } from '../types/endpoints';
import { isUUID } from '../utils';


const db = database();
export default class BeneficiaryService {

    public static async add(
        address: string,
        communityId: string,
        tx: string,
        txAt: Date,
    ): Promise<boolean> {
        // if user does not exist, add to pending list
        // otherwise update
        const user = await db.models.beneficiary.findOne({ where: { address, active: false } });
        if (user === null) {
            const beneficiaryData = {
                address,
                communityId,
                tx,
                txAt,
            };
            try {
                await db.models.beneficiary.create(beneficiaryData);
            } catch (e) {
                if (e.name !== 'SequelizeUniqueConstraintError') {
                    Logger.error('Error inserting new Beneficiary. Data = ' + JSON.stringify(beneficiaryData));
                    Logger.error(e);
                }
            }
        } else {
            await db.models.beneficiary.update({ active: true }, { where: { address } });
        }
        return true;
    }

    public static async getAllAddressesInPublicValidCommunities(): Promise<string[]> {
        const publicCommunities: string[] = (await db.models.community.findAll({
            attributes: ['publicId'],
            where: { visibility: 'public', status: 'valid' }
        })).map((c) => c.publicId);

        return (await db.models.beneficiary.findAll({
            attributes: ['address'],
            where: {
                communityId: { [Op.in]: publicCommunities },
                active: true
            }
        })).map((b) => b.address);
    }

    public static async listActiveInCommunity(
        communityId: string,
    ): Promise<Beneficiary[]> {
        return await db.models.beneficiary.findAll({
            where: {
                communityId,
                active: true
            },
            order: [['txAt', 'DESC']]
        });
    }

    public static async countInCommunity(
        communityId: string,
    ): Promise<{ active: number, inactive: number }> {
        const active: { total: string } = (await db.models.beneficiary.findAll({
            attributes: [
                [fn('count', col('address')), 'total']
            ],
            where: {
                communityId,
                active: true
            }
        }))[0] as any;
        const inactive: { total: string } = (await db.models.beneficiary.findAll({
            attributes: [
                [fn('count', col('address')), 'total']
            ],
            where: {
                communityId,
                active: false
            }
        }))[0] as any;
        return {
            active: parseInt(active.total, 10),
            inactive: parseInt(inactive.total, 10)
        }
    }

    public static async listAllInCommunity(
        communityId: string,
    ): Promise<{ active: IManagerDetailsBeneficiary[], inactive: IManagerDetailsBeneficiary[] }> {

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

        const active: IManagerDetailsBeneficiary[] = await db.sequelize.query("select b.address, u.username, b.\"txAt\" \"timestamp\", COALESCE(sum(c.amount), 0) claimed from beneficiary b left join \"user\" u on b.address = u.address left join claim c on b.address = c.address where b.\"communityId\" = '" + communityId + "' and b.active = true group by b.address, u.username, b.\"txAt\" order by b.\"txAt\" desc", { type: QueryTypes.SELECT });

        const inactive: IManagerDetailsBeneficiary[] = await db.sequelize.query("select b.address, u.username, b.\"txAt\" \"timestamp\", COALESCE(sum(c.amount), 0) claimed from beneficiary b left join \"user\" u on b.address = u.address left join claim c on b.address = c.address where b.\"communityId\" = '" + communityId + "' and b.active = false group by b.address, u.username, b.\"txAt\" order by b.\"txAt\" desc", { type: QueryTypes.SELECT });

        return {
            active,
            inactive
        }
    }

    public static async get(
        address: string,
    ): Promise<Beneficiary | null> {
        return await db.models.beneficiary.findOne({ where: { address } });
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (await db.models.beneficiary.findAll({ attributes: ['address'] })).map((b) => b.address);
    }

    public static async remove(
        address: string,
    ): Promise<void> {
        await db.models.beneficiary.update({ active: false }, { where: { address } });
    }

    public static async getActiveBeneficiariesLast30Days(): Promise<Map<string, number>> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const result = await db.models.beneficiary.findAll({
            attributes: [
                [fn('count', col('address')), 'total'],
                'communityId',
            ],
            where: {
                lastClaimAt: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                }
            },
            group: 'communityId',
        });
        return new Map(result.map((c: any) => [c.communityId, c.total]));
    }

}