import { ReachedAddressCreationAttributes } from '@models/reachedAddress';
import { col, fn, Op } from 'sequelize';

import { models, Sequelize } from '../database';

export default class ReachedAddressService {
    public static reachedAddress = models.reachedAddress;

    public static async getAllReachedLast30Days(): Promise<{
        reach: number;
        reachOut: number;
    }> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const rReachLast30Days = await this.reachedAddress.count({
            // attributes: [[fn('count', col('address')), 'total']],
            where: {
                lastInteraction: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                },
            },
        });
        const rReachOutLast30Days = await this.reachedAddress.count({
            // attributes: [[fn('count', col('address')), 'total']],
            where: {
                lastInteraction: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                },
                address: {
                    [Op.notIn]: Sequelize.literal(
                        '(select distinct address from beneficiary)'
                    ),
                },
            },
        });
        return {
            reach: rReachLast30Days,
            reachOut: rReachOutLast30Days,
        };
    }

    public static async getAllReachedEver(): Promise<{
        reach: number;
        reachOut: number;
    }> {
        console.log(this.reachedAddress);
        const rReach = await this.reachedAddress.count({
            where: {}
        });
        const rReachOut = await this.reachedAddress.count({
            // attributes: [[fn('count', col('address')), 'total']],
            where: {
                address: {
                    [Op.notIn]: Sequelize.literal(
                        '(select distinct address from beneficiary)'
                    ),
                },
            },
        });
        return {
            reach: rReach,
            reachOut: rReachOut,
        };
    }

    /**
     * Insert all new reached addresses and update last interaction to existing ones.
     * @param reached list of addresses reached on privious day to when global status was calculated
     */
    public static async updateReachedList(reached: string[]): Promise<void> {
        const bulkReachedAdd: ReachedAddressCreationAttributes[] = [];

        for (let r = 0; r < reached.length; r++) {
            bulkReachedAdd.push({
                address: reached[r],
                lastInteraction: new Date(),
            });
        }

        await this.reachedAddress.bulkCreate(bulkReachedAdd, {
            updateOnDuplicate: ['lastInteraction'],
        });
    }
}
