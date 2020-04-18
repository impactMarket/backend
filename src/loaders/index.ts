import express from 'express';
import expressLoader from './express';
// import mongooseLoader from './mongoose';
// import jobsLoader from './jobs';
import Logger from './logger';
//We have to import at least all the events once so they can be triggered
import './events';

export default async (props: { expressApp: express.Application }) => {

    await expressLoader({ app: props.expressApp });
    Logger.info('✌️ Express loaded');
};