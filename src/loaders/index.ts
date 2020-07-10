import express from 'express';
import Logger from './logger';
import expressLoader from './express';
import databaseLoader from './database';
import jobsLoader from './jobs';

export default async ({ expressApp }: { expressApp: express.Application }): Promise<void> => {
    const sequelize = await databaseLoader();
    Logger.info('🗺️  DB loaded and connected');
    
    await jobsLoader();
    Logger.info('🛠️  Jobs loaded');

    await expressLoader({ app: expressApp, sequelize });
    Logger.info('📡 Express loaded');
};