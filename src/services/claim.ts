import { fn, Op } from 'sequelize';
import { Claim } from '../db/models/claim';
import Logger from '../loaders/logger';


export default class ClaimService {

    public static async add(
        address: string,
        communityId: string,
        amount: string,
        tx: string,
    ): Promise<void> {
        try {
            await Claim.create({
                address,
                communityId,
                amount,
                tx,
                txAt: new Date(),
            });
        } catch (e) {
            Logger.info(e);
        }
    }

    /**
     * Get monthly (last 30 days) claimed amounts grouped by community.
     * 
     * **NOTE**: claimed amounts will always be bigger than zero though,
     * a community might not be listed if no claim has ever happened!
     * 
     * @returns Map< communityId, amount >
     */
    public static async getMonthlyClaimed(): Promise<Map<string, string>> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const aMonthAgo = new Date(today.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const claimed = await Claim.findAll({
            attributes: ['communityId', [fn('sum', 'amount'), 'claimed']],
            where: {
                txAt: {
                    [Op.lt]: today,
                    [Op.gte]: aMonthAgo,
                }
            },
            group: 'communityId',
        });
        // there will always be claimed.lenght > 0 (were only zero at the begining)
        return new Map((claimed as any).map((c: { claimed: string, communityId:string }) => [c.communityId, c.claimed]));
    }
}