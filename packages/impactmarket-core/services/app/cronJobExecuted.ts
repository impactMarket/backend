import { Logger } from '../../utils/logger';

import { models } from '../../database';

export default class CronJobExecutedService {
    public static cronJobExecuted = models.cronJobExecuted;

    public static async add(jobName: string): Promise<void> {
        try {
            await this.cronJobExecuted.create({
                jobName,
                lastExecuted: new Date(),
            });
        } catch (e) {
            Logger.warn('Error registering "' + jobName + '" activity. ' + e);
        }
    }
}
