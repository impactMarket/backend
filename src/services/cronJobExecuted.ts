import { CronJobExecuted } from '../db/models/cronJobExecuted';
import { Logger } from '../loaders/logger';

export default class CronJobExecutedService {
    public static async add(jobName: string): Promise<void> {
        try {
            await CronJobExecuted.create({
                jobName,
                lastExecuted: new Date(),
            });
        } catch (e) {
            Logger.info(e);
        }
    }
}
