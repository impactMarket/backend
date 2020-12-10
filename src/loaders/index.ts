import express from 'express';
import Logger from './logger';
import expressLoader from './express';
import databaseLoader from './database';
import jobsLoader from './jobs';

export default async ({ expressApp }: { expressApp: express.Application }): Promise<void> => {

    if (process.env.NODE_ENV === 'development') {
        Logger.debug('DEBUG');
        Logger.verbose('VERBOSE');
        Logger.info('INFO');
        Logger.warn('WARNING');
        Logger.error('ERROR');
    }

    await databaseLoader();
    Logger.info('🗺️  DB loaded and connected');
    
    await jobsLoader();
    Logger.info('🛠️  Jobs loaded');

    await expressLoader({ app: expressApp });
    Logger.info('📡 Express loaded');
};