import express from 'express';
import expressLoader from './express';
import databaseLoader from './database';
import Logger from './logger';
import jobsLoader from './jobs';

export default async ({ expressApp }: { expressApp: express.Application }): Promise<void> => {
    await databaseLoader();
    Logger.info('🗺️  DB loaded and connected');
    
    await jobsLoader();
    Logger.info('🛠️  Jobs loaded');

    await expressLoader({ app: expressApp });
    Logger.info('📡 Express loaded');
};