import express from 'express';

import { Logger } from './logger';
import databaseLoader from './database';
import expressLoader from './express';
// import jobsLoader from './jobs';

export default async ({ expressApp }: { expressApp: express.Application }): Promise<void> => {
    if (process.env.NODE_ENV === 'development') {
        Logger.debug('DEBUG');
        Logger.verbose('VERBOSE');
        Logger.info('INFO');
        Logger.warn('WARNING');
        Logger.error('ERROR');
    }
    
    const dbLoader = databaseLoader();
    await dbLoader.sequelize.authenticate();
    await dbLoader.sequelize.sync();
    Logger.info('🗺️  DB loaded and connected');

    // await jobsLoader();
    // Logger.info('🛠️  Jobs loaded');

    await expressLoader({ app: expressApp });
    Logger.info('📡 Express loaded');
};
