import { UbiClaimCreation } from '@interfaces/ubi/ubiClaim';
import { Logger } from '@utils/logger';
import { col, fn, Op, QueryTypes } from 'sequelize';

import { models, sequelize } from '../../database';

export default class ClaimService {
    public static async add(claimData: UbiClaimCreation): Promise<void> {
        try {
            await models.ubiClaim.create(claimData);
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

    public static async uniqueBeneficiariesAndClaimedLast7Days(): Promise<{
        beneficiaries: number;
        claimed: string;
    }> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // seven days ago, from todayMidnightTime
        const sevenDaysAgo = new Date(todayMidnightTime.getTime() - 604800000); // 7 * 24 * 60 * 60 * 1000
        const result = (
            await models.ubiClaim.findAll({
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
