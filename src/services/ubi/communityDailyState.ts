import { UbiCommunityDailyStateCreation } from '@interfaces/ubi/ubiCommunityDailyState';
import moment from 'moment';
import { Transaction, QueryTypes } from 'sequelize';

import { models, sequelize } from '../../database';

export default class CommunityDailyStateService {
    public static ubiCommunityDailyState = models.ubiCommunityDailyState;
    public static sequelize = sequelize;

    // TODO: change this method to have communityId as optional
    // if not undefined, populate the next five days for all existing 'valid' communities
    public static async populateNext5Days(
        communityId: number,
        t: Transaction | undefined = undefined
    ): Promise<void> {
        const days = 5;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resultLastDay = await this.ubiCommunityDailyState.findAll({
            attributes: ['date'],
            where: { communityId },
            order: [['date', 'DESC']],
            limit: 1,
            raw: true,
        });
        let lastDay: Date;
        if (resultLastDay.length === 0) {
            // yesterday, since we start by adding one day to the last one
            lastDay = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        } else {
            lastDay = new Date(resultLastDay[0].date);
        }
        let missingDays = moment(
            today.getTime() + days * 24 * 60 * 60 * 1000
        ).diff(lastDay, 'days');
        const emptyDays: UbiCommunityDailyStateCreation[] = [];
        while (missingDays-- > 0) {
            lastDay.setTime(lastDay.getTime() + 24 * 60 * 60 * 1000);
            emptyDays.push({
                communityId,
                // use new Date, otherwise it will use the object reference,
                // resulting in the same date for each added row
                date: new Date(lastDay),
            });
        }
        if (emptyDays.length > 0) {
            await this.ubiCommunityDailyState.bulkCreate(emptyDays, {
                transaction: t,
            });
        }
    }

    /**
     * 💂‍♀️ yes sir, that's about it!
     * Used on dashboard to provider "real time" data
     */
    public static async notYetCountedToday(): Promise<{
        totalClaimed: string;
        totalBeneficiaries: number;
        totalRaised: string;
    }> {
        const query = `select sum(cs.claimed) "totalClaimed",
                        sum(cs.beneficiaries) "totalBeneficiaries",
                        sum(cs.raised) "totalRaised"
                from ubi_community_daily_state cs, community c
                where cs."communityId" = c.id
                and c.status = 'valid'
                and c.visibility = 'public'
                and cs.date = '${new Date().toISOString().split('T')[0]}'`;

        const result = await this.sequelize.query<{
            totalClaimed: string;
            totalBeneficiaries: string;
            totalRaised: string;
        }>(query, { type: QueryTypes.SELECT });
        // it was null just once at the system's begin.
        const g = result[0];
        return {
            totalClaimed: g.totalClaimed,
            totalBeneficiaries: parseInt(g.totalBeneficiaries, 10),
            totalRaised: g.totalRaised,
        };
    }
}
