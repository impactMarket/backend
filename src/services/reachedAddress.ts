import { col, fn, Op } from 'sequelize';
import { ReachedAddress } from '../db/models/reachedAddress';

export default class ReachedAddressService {

    public static async getAllReachedLast30Days(): Promise<number> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const result = await ReachedAddress.findAll({
            attributes: [[fn('count', col('address')), 'total']],
            where: {
                lastInteraction: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                }
            }
        });
        const reachedAddressesLast30Days = (result[0] as any);
        return parseInt(reachedAddressesLast30Days.total, 10);
    }

    public static async getAllReachedEver(): Promise<number> {
        const result = await ReachedAddress.findAll({
            attributes: [[fn('count', col('address')), 'total']],
        });
        const existingAddresses = (result[0] as any);
        return parseInt(existingAddresses.total, 10);
    }
}