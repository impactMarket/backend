import moment from 'moment';
import { Op, fn, col } from 'sequelize';
import { CommunityDailyState, ICommunityDailyStatusInsert } from '../db/models/communityDailyState';
import Logger from '../loaders/logger';


export default class CommunityDailyStateService {

    public static async insertEmptyDailyState(
        communityId: string,
        starting: Date,
        days: number,
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
            starting.setTime(starting.getTime() + (24 * 60 * 60 * 1000));
        } while (--days > 0);
        await CommunityDailyState.bulkCreate(emptyDays);
    }

    public static async populateNext5Days(
        communityId: string,
    ): Promise<void> {
        const days = 5;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDay = (await CommunityDailyState.findOne({ where: { communityId }, order: [['date', 'DESC']] }))!.date;
        let missingDays = moment(today.setTime(today.getTime() + (days * 24 * 60 * 60 * 1000))).diff(lastDay, 'days');
        const emptyDays: ICommunityDailyStatusInsert[] = [];
        while (missingDays-- > 0) {
            emptyDays.push({
                communityId,
                claimed: '0',
                claims: 0,
                beneficiaries: 0,
                raised: '0',
                backers: 0,
                date: lastDay,
            });
            lastDay.setTime(lastDay.getTime() + (24 * 60 * 60 * 1000));
        }
        await CommunityDailyState.bulkCreate(emptyDays);
    }

    public static async getAll(
        date: Date,
    ): Promise<CommunityDailyState[]> {
        // set to beginning day, in case by mistake it wasn't done
        date.setHours(0, 0, 0, 0);
        return await CommunityDailyState.findAll({
            where: { date },
        });
    }

    /**
     * Get total claimed for each community, for the 7 previous days, starting yesterdayDateOnly.
     */
    public static async getTotalClaimedLast7Days(): Promise<Map<string, string>> {
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);
        // seven days ago, from yesterdayDateOnly
        const sevenDaysAgo = new Date(yesterdayDateOnly.getTime() - 604800000); // 7 * 24 * 60 * 60 * 1000
        return new Map((await CommunityDailyState.findAll({
            attributes: ['communityId', [fn('sum', col('claimed')), 'totalClaimed']],
            where: {
                date: {
                    [Op.lte]: yesterdayDateOnly,
                    [Op.gte]: sevenDaysAgo,
                }
            },
            group: 'communityId'
        })).map((c: any) => [c.communityId, c.totalClaimed]));
    }

    public static async getYesterdayCommunitiesSum(): Promise<{
        totalClaimed: string;
        totalClaims: number;
        totalBeneficiaries: number;
        totalRaised: string;
    }> {
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);
        const summedResults = (await CommunityDailyState.findAll({
            attributes: [
                [fn('sum', col('claimed')), 'totalClaimed'],
                [fn('sum', col('claims')), 'totalClaims'],
                [fn('sum', col('beneficiaries')), 'totalBeneficiaries'],
                [fn('sum', col('raised')), 'totalRaised'],
            ],
            where: {
                date: yesterdayDateOnly
            },
        }))[0];
        return {
            totalClaimed: (summedResults as any).totalClaimed,
            totalClaims: parseInt((summedResults as any).totalClaims),
            totalBeneficiaries: parseInt((summedResults as any).totalBeneficiaries),
            totalRaised: (summedResults as any).totalClaimed,
        };
    }
}