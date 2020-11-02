import moment from 'moment';
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
        while(missingDays-- > 0) {
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
}