import { col, fn, Op } from 'sequelize';
import database from '../loaders/database';

const db = database();
export default class ReachedAddressService {
    public static async getAllReachedLast30Days(): Promise<number> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const result = await db.models.reachedAddress.findAll({
            attributes: [[fn('count', col('address')), 'total']],
            where: {
                lastInteraction: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                },
            },
        });
        const reachedAddressesLast30Days = result[0] as any;
        return parseInt(reachedAddressesLast30Days.total, 10);
    }

    public static async getAllReachedEver(): Promise<number> {
        const result = await db.models.reachedAddress.findAll({
            attributes: [[fn('count', col('address')), 'total']],
        });
        const existingAddresses = result[0] as any;
        return parseInt(existingAddresses.total, 10);
    }
}
