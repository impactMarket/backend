import moment from 'moment';
import { Op, fn, col } from 'sequelize';
import {
    CommunityDailyState,
    ICommunityDailyStatusInsert,
} from '../db/models/communityDailyState';

export default class CommunityDailyStateService {
    public static async insertEmptyDailyState(
        communityId: string,
        starting: Date,
        days: number
    ): Promise<void> {
        // set to beginning day, in case by mistake it wasn't done
        starting.setHours(0, 0, 0, 0);
        const emptyDays: ICommunityDailyStatusInsert[] = [];
        do {
            emptyDays.push({
                communityId,
                claimed: '0',
                claims: 0,
                beneficiaries: 0,
                raised: '0',
                backers: 0,
                date: starting,
            });
            starting.setTime(starting.getTime() + 24 * 60 * 60 * 1000);
        } while (--days > 0);
        await CommunityDailyState.bulkCreate(emptyDays);
    }

    // TODO: change this method to have communityId as optional
    // if not undefined, populate the next five days for all existing 'valid' communities
    public static async populateNext5Days(communityId: string): Promise<void> {
        const days = 5;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resultLastDay = await CommunityDailyState.findAll({
            attributes: ['date'],
            where: { communityId },
            order: [['date', 'DESC']],
            limit: 1,
        });
        let lastDay;
        if (resultLastDay.length === 0) {
            lastDay = today;
        } else {
            lastDay = new Date(resultLastDay[0].date);
        }
        console.log(lastDay);
        let missingDays = moment(
            today.setTime(today.getTime() + days * 24 * 60 * 60 * 1000)
        ).diff(lastDay, 'days');
        const emptyDays: ICommunityDailyStatusInsert[] = [];
        while (missingDays-- > 0) {
            lastDay.setTime(lastDay.getTime() + 24 * 60 * 60 * 1000);
            emptyDays.push({
                communityId,
                claimed: '0',
                claims: 0,
                beneficiaries: 0,
                raised: '0',
                backers: 0,
                // use new Date, otherwise it will use the object reference,
                // resulting in the same date for each added row
                date: new Date(lastDay),
            });
        }
        if (emptyDays.length > 0) {
            await CommunityDailyState.bulkCreate(emptyDays);
        }
    }

    public static async getAll(date: Date): Promise<CommunityDailyState[]> {
        // set to beginning day, in case by mistake it wasn't done
        date.setHours(0, 0, 0, 0);
        return await CommunityDailyState.findAll({
            where: { date },
        });
    }

    /**
     * Get total claimed for each community, for the 7 previous days, starting todayMidnightTime.
     */
    public static async getTotalClaimedLast30Days(): Promise<
        Map<string, string>
    > {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        return new Map(
            (
                await CommunityDailyState.findAll({
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
                })
            ).map((c: any) => [c.communityId, c.totalClaimed])
        );
    }

    public static async getYesterdayCommunitiesSum(): Promise<{
        totalClaimed: string;
        totalClaims: number;
        totalBeneficiaries: number;
        totalRaised: string;
    }> {
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);
        const summedResults = (
            await CommunityDailyState.findAll({
                attributes: [
                    [fn('sum', col('claimed')), 'totalClaimed'],
                    [fn('sum', col('claims')), 'totalClaims'],
                    [fn('sum', col('beneficiaries')), 'totalBeneficiaries'],
                    [fn('sum', col('raised')), 'totalRaised'],
                ],
                where: {
                    date: yesterdayDateOnly,
                },
            })
        )[0];
        return {
            totalClaimed: (summedResults as any).totalClaimed,
            totalClaims: parseInt((summedResults as any).totalClaims),
            totalBeneficiaries: parseInt(
                (summedResults as any).totalBeneficiaries
            ),
            totalRaised: (summedResults as any).totalRaised,
        };
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
        const justToday = new Date();
        const result = await CommunityDailyState.findAll({
            attributes: [
                [fn('sum', col('claimed')), 'totalClaimed'],
                [fn('sum', col('beneficiaries')), 'totalBeneficiaries'],
                [fn('sum', col('raised')), 'totalRaised'],
            ],
            where: {
                date: justToday,
            },
        });
        // it was null just once at the system's begin.
        const g = result[0] as any;
        return {
            totalClaimed: g.totalClaimed,
            totalBeneficiaries: parseInt(g.totalBeneficiaries, 10),
            totalRaised: g.totalRaised,
        };
    }
}
