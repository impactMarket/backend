import express from 'express';
import expressLoader from './express';
import databaseLoader from './database';
import Logger from './logger';
import subscribersLoader from './subscribers';

export default async ({ expressApp }: { expressApp: express.Application }) => {
    await databaseLoader();
    Logger.info('✌️ DB loaded and connected');
    
    await subscribersLoader();
    Logger.info('✌️ Transaction cache loaded');

    await expressLoader({ app: expressApp });
    Logger.info('✌️ Express loaded');
};