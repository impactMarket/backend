import { fn, Op } from 'sequelize';
import { Inflow } from '../db/models/inflow';
import Logger from '../loaders/logger';


export default class InflowService {

    public static async add(
        from: string,
        communityId: string,
        amount: string,
        tx: string,
    ): Promise<void> {
        try {
            await Inflow.create({
                from,
                communityId,
                amount,
                tx,
                txAt: new Date(),
            });
        } catch(e) {
            Logger.info(e);
        }
    }

    /**
     * Get monthly (last 30 days) raised amounts grouped by community.
     * 
     * **NOTE**: raised amounts will always be bigger than zero though,
     * a community might not be listed if no raise has ever happened!
     * 
     * @returns Map< communityId, amount >
     */
    public static async getMonthlyRaised(): Promise<Map<string, string>> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const aMonthAgo = new Date(today.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const raised = await Inflow.findAll({
            attributes: ['communityId', [fn('sum', 'amount'), 'raised']],
            where: {
                txAt: {
                    [Op.lt]: today,
                    [Op.gte]: aMonthAgo,
                }
            },
            group: 'communityId',
        });
        // there will always be raised.lenght > 0 (were only zero at the begining)
        return new Map((raised as any).map((c: { raised: string, communityId:string }) => [c.communityId, c.raised]));
    }
}