import { Op } from 'sequelize';

import { queries } from '../subgraph';
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
        const startDayId = (((today.getTime() / 1000) | 0) / 86400) | 0;
        const endDayId = (((aMonthAgo.getTime() / 1000) | 0) / 86400) | 0;
        const ubiDaily = await queries.ubi.getUbiDailyEntity(
            `id_gte: ${endDayId}, id_lt: ${startDayId}`
        );
        const result = ubiDaily.reduce((acc, el) => {
            acc += el.reach;
            return acc;
        }, 0);

        return {
            reach: result,
            reachOut: 0,
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
