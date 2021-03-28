import { Logger } from '@utils/logger';
import { col, fn, Op } from 'sequelize';

import { models } from '../../database';

export default class InflowService {
    public static inflow = models.inflow;

    public static async add(
        from: string,
        communityId: string,
        amount: string,
        tx: string,
        txAt: Date
    ): Promise<void> {
        const inflowData = {
            from,
            communityId,
            amount,
            tx,
            txAt,
        };
        try {
            await this.inflow.create(inflowData);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new Inflow. Data = ' +
                        JSON.stringify(inflowData)
                );
                Logger.error(e);
            }
        }
    }

    /**
     * Get total monthly (last 30 days, starting todayMidnightTime) raised amounts.
     *
     * **NOTE**: raised amounts will always be bigger than zero though,
     * a community might not be listed if no raise has ever happened!
     *
     * @returns string
     */
    public static async getMonthlyRaised(from: Date): Promise<string> {
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date();
        aMonthAgo.setDate(from.getDate() - 30);
        const raised: { raised: string } = (
            await this.inflow.findAll({
                attributes: [[fn('sum', col('amount')), 'raised']],
                where: {
                    txAt: {
                        [Op.lt]: from,
                        [Op.gte]: aMonthAgo,
                    },
                },
                raw: true,
            })
        )[0] as any;
        // there will always be raised.lenght > 0 (were only zero at the begining)
        return raised.raised;
    }

    public static async getAllBackers(communityId: string): Promise<string[]> {
        const backers = (
            await this.inflow.findAll({
                attributes: [[fn('distinct', col('from')), 'backerAddress']],
                where: { communityId },
                raw: true,
            })
        ).map((b: any) => b.backerAddress);
        return backers;
    }

    /**
     * Count unique backers since the begining of the project.
     */
    public static async countEvergreenBackers(): Promise<number> {
        const backers: { total: string } = (
            await this.inflow.findAll({
                attributes: [
                    [fn('count', fn('distinct', col('from'))), 'total'],
                ],
                raw: true,
            })
        )[0] as any;
        return parseInt(backers.total, 10);
    }

    /**
     * Count unique backers and total funded in the last 30 days-
     */
    public static async uniqueBackersAndFundingLast30Days(
        from: Date
    ): Promise<{
        backers: number;
        funding: string;
    }> {
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date();
        aMonthAgo.setDate(from.getDate() - 30);
        const result: { backers: string; funding: string } = (
            await this.inflow.findAll({
                attributes: [
                    [fn('count', fn('distinct', col('from'))), 'backers'],
                    [fn('sum', col('amount')), 'funding'],
                ],
                where: {
                    txAt: {
                        [Op.lt]: from,
                        [Op.gte]: aMonthAgo,
                    },
                },
                raw: true,
            })
        )[0] as any;
        return {
            backers: parseInt(result.backers),
            funding: result.funding,
        };
    }
}
