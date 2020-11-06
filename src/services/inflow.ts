import { fn, Op } from 'sequelize';
import { Inflow } from '../db/models/inflow';
import Logger from '../loaders/logger';


export default class InflowService {

    public static async add(
        from: string,
        communityId: string,
        amount: string,
        tx: string,
        txAt: Date,
    ): Promise<void> {
        try {
            await Inflow.create({
                from,
                communityId,
                amount,
                tx,
                txAt,
            });
        } catch(e) {
            Logger.info(e);
        }
    }

    /**
     * Get total monthly (last 30 days, starting yesterday) raised amounts.
     * 
     * **NOTE**: raised amounts will always be bigger than zero though,
     * a community might not be listed if no raise has ever happened!
     * 
     * @returns string
     */
    public static async getMonthlyRaised(): Promise<string> {
        const yesterday = new Date(new Date().getTime() - 86400000);
        yesterday.setHours(0, 0, 0, 0);
        // 30 days ago, from yesterday
        const aMonthAgo = new Date(yesterday.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const raised = await Inflow.findAll({
            attributes: [[fn('sum', 'amount'), 'raised']],
            where: {
                txAt: {
                    [Op.lte]: yesterday,
                    [Op.gte]: aMonthAgo,
                }
            },
        });
        // there will always be raised.lenght > 0 (were only zero at the begining)
        return (raised as any).raised;
    }

    /**
     * Count unique backers since the begining of the project.
     */
    public static async countEvergreenBackers(): Promise<number> {
        const backers = await Inflow.findAll({
            attributes: [[fn('count', fn('distinct', 'from')), 'total']],
        });
        return (backers as any).total;
    }

    /**
     * Count unique backers and total funded in the last 30 days-
     */
    public static async uniqueBackersAndFundingLast30Days(): Promise<{
        backers: number;
        funding: string;
    }> {
        const yesterday = new Date(new Date().getTime() - 86400000);
        yesterday.setHours(0, 0, 0, 0);
        // 30 days ago, from yesterday
        const aMonthAgo = new Date(yesterday.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const result = await Inflow.findAll({
            attributes: [
                [fn('count', fn('distinct', 'from')), 'backers'],
                [fn('sum', 'amount'), 'funding']
            ],
            where: {
                txAt: {
                    [Op.lte]: yesterday,
                    [Op.gte]: aMonthAgo,
                }
            },
        });
        return {
            backers: (result as any).backers,
            funding: (result as any).funding,
        }
    }
}