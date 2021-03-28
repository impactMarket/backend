import { Logger } from '@utils/logger';
import { col, fn, Op } from 'sequelize';

import { models } from '../../database';

export default class ClaimService {
    public static claim = models.claim;

    public static async add(
        address: string,
        communityId: string,
        amount: string,
        tx: string,
        txAt: Date
    ): Promise<void> {
        const claimData = {
            address,
            communityId,
            amount,
            tx,
            txAt,
        };
        try {
            await this.claim.create(claimData);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new Claim. Data = ' +
                        JSON.stringify(claimData)
                );
                Logger.error(e);
            }
        }
    }

    /**
     * Get total monthly (last 30 days, starting todayMidnightTime) claimed.
     *
     * **NOTE**: claimed amounts will always be bigger than zero though,
     * a community might not be listed if no claim has ever happened!
     *
     * @returns string
     */
    public static async getMonthlyClaimed(from: Date): Promise<string> {
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date();
        aMonthAgo.setDate(from.getDate() - 30);
        //
        const claimed: { claimed: string } = (
            await this.claim.findAll({
                attributes: [[fn('sum', col('amount')), 'claimed']],
                where: {
                    txAt: {
                        [Op.lt]: from,
                        [Op.gte]: aMonthAgo,
                    },
                },
                raw: true,
            })
        )[0] as any;
        // there will always be claimed.lenght > 0 (were only zero at the begining)
        return claimed.claimed;
    }

    public static async uniqueBeneficiariesAndClaimedLast7Days(): Promise<{
        beneficiaries: number;
        claimed: string;
    }> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // seven days ago, from todayMidnightTime
        const sevenDaysAgo = new Date(todayMidnightTime.getTime() - 604800000); // 7 * 24 * 60 * 60 * 1000
        const result = (
            await this.claim.findAll({
                attributes: [
                    [
                        fn('count', fn('distinct', col('address'))),
                        'beneficiaries',
                    ],
                    [fn('sum', col('amount')), 'claimed'],
                ],
                where: {
                    txAt: {
                        [Op.lt]: todayMidnightTime,
                        [Op.gte]: sevenDaysAgo,
                    },
                },
                raw: true,
            })
        )[0];
        return {
            beneficiaries: (result as any).beneficiaries,
            claimed: (result as any).claimed,
        };
    }
}
