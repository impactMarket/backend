import {
    GlobalDailyGrowth,
    GlobalDailyGrowthCreation,
} from '@interfaces/globalDailyGrowth';

import { models } from '../database';

export default class GlobalDailyGrowthService {
    public globalDailyGrowth = models.globalDailyGrowth;

    public async add(
        state: GlobalDailyGrowthCreation
    ): Promise<GlobalDailyGrowth> {
        return await this.globalDailyGrowth.create(state);
    }

    public async getLast(): Promise<GlobalDailyGrowth> {
        // it was null just once at the system's begin.
        const last = await this.globalDailyGrowth.findAll({
            order: [['date', 'DESC']],
            limit: 1,
        });
        return last[0];
    }
}
