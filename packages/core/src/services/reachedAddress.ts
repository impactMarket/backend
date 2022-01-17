import { Op } from 'sequelize';

import { models, Sequelize } from '../database';
import { ReachedAddressCreationAttributes } from '../database/models/reachedAddress';

export default class ReachedAddressService {
    public reachedAddress = models.reachedAddress;

    /**
     * Last 30 days, today excluded.
     */
    public async getAllReachedLast30Days(): Promise<{
        reach: number;
        reachOut: number;
    }> {
        const today = new Date();
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date();
        aMonthAgo.setDate(aMonthAgo.getDate() - 30);
        const rReachLast30Days = await this.reachedAddress.count({
            // attributes: [[fn('count', col('address')), 'total']],
            where: {
                lastInteraction: {
                    [Op.lt]: today,
                    [Op.gte]: aMonthAgo,
                },
            },
        });
        const rReachOutLast30Days = await this.reachedAddress.count({
            // attributes: [[fn('count', col('address')), 'total']],
            where: {
                lastInteraction: {
                    [Op.lt]: today,
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

    public async getAllReachedEver(): Promise<{
        reach: number;
        reachOut: number;
    }> {
        const rReach = await this.reachedAddress.count({
            where: {},
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
    public async updateReachedList(reached: string[]): Promise<void> {
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
