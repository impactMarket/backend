import { Op, fn, col } from 'sequelize';
import { Beneficiary } from '../db/models/beneficiary';
import database from '../loaders/database';
import { Logger } from '../loaders/logger';


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

    public static async getAllInCommunity(
        communityId: string,
    ): Promise<Beneficiary[]> {
        return await db.models.beneficiary.findAll({
            where: {
                communityId,
                active: true
            }
        });
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