import express from 'express';

import databaseLoader from './database';
import expressLoader from './express';
import jobsLoader from './jobs';
import Logger from './logger';

export default async ({
    expressApp,
}: {
    expressApp: express.Application;
}): Promise<void> => {
    await databaseLoader();
    Logger.info('🗺️  DB loaded and connected');

    await jobsLoader();
    Logger.info('🛠️  Jobs loaded');

    await expressLoader({ app: expressApp });
    Logger.info('📡 Express loaded');
};
