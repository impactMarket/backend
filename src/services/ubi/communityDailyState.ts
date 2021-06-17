import {
    UbiCommunityDailyState,
    UbiCommunityDailyStateCreation,
} from '@interfaces/ubi/ubiCommunityDailyState';
import moment from 'moment';
import { Op, fn, col, Transaction, QueryTypes } from 'sequelize';

import { models, sequelize } from '../../database';

export default class CommunityDailyStateService {
    public static ubiCommunityDailyState = models.ubiCommunityDailyState;
    public static sequelize = sequelize;

    public static async insertEmptyDailyState(
        communityId: number,
        starting: Date,
        days: number
    ): Promise<void> {
        // set to beginning day, in case by mistake it wasn't done
        starting.setHours(0, 0, 0, 0);
        const emptyDays: UbiCommunityDailyStateCreation[] = [];
        do {
            emptyDays.push({
                communityId,
                date: starting,
            });
            starting.setTime(starting.getTime() + 24 * 60 * 60 * 1000);
        } while (--days > 0);
        await this.ubiCommunityDailyState.bulkCreate(emptyDays);
    }

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

    public static async getAll(date: Date): Promise<UbiCommunityDailyState[]> {
        // set to beginning day, in case by mistake it wasn't done
        date.setHours(0, 0, 0, 0);
        return await this.ubiCommunityDailyState.findAll({
            where: { date },
            raw: true,
        });
    }

    /**
     * Get total claimed for each community, for the 7 previous days, starting todayMidnightTime.
     */
    public static async getTotalClaimedLast30Days(): Promise<
        Map<number, string>
    > {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        return new Map(
            (
                await this.ubiCommunityDailyState.findAll({
                    attributes: [
                        'communityId',
                        [fn('sum', col('claimed')), 'totalClaimed'],
                    ],
                    where: {
                        date: {
                            [Op.lt]: todayMidnightTime,
                            [Op.gte]: aMonthAgo,
                        },
                    },
                    group: 'communityId',
                    raw: true,
                })
            ).map((c: any) => [c.communityId, c.totalClaimed])
        );
    }

    // public static async getPublicCommunitiesSum(
    //     date: Date
    // ): Promise<{
    //     totalClaimed: string;
    //     totalClaims: number;
    //     totalBeneficiaries: number;
    //     totalRaised: string;
    // }> {
    //     const query = `select sum(cs.claimed) "totalClaimed",
    //                     sum(cs.claims) "totalClaims",
    //                     sum(cs.beneficiaries) "totalBeneficiaries",
    //                     sum(cs.raised) "totalRaised"
    //             from ubi_community_daily_state cs, community c
    //             where cs."communityId" = c.id
    //             and c.status = 'valid'
    //             and c.visibility = 'public'
    //             and cs.date = '${date.toISOString().split('T')[0]}'`;

    //     const result = await this.sequelize.query<{
    //         totalClaimed: string;
    //         totalClaims: string;
    //         totalBeneficiaries: string;
    //         totalRaised: string;
    //     }>(query, { type: QueryTypes.SELECT });

    //     return {
    //         totalClaimed: result[0].totalClaimed,
    //         totalClaims: parseInt(result[0].totalClaims, 10),
    //         totalBeneficiaries: parseInt(result[0].totalBeneficiaries, 10),
    //         totalRaised: result[0].totalRaised,
    //     };
    // }

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
