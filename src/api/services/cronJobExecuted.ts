import { Logger } from '@logger/logger';

import database from '../loaders/database';

const db = database();
export default class CronJobExecutedService {
    public static async add(jobName: string): Promise<void> {
        try {
            await db.models.cronJobExecuted.create({
                jobName,
                lastExecuted: new Date(),
            });
        } catch (e) {
            Logger.warn('Error registering "' + jobName + '" activity. ' + e);
        }
    }
}
