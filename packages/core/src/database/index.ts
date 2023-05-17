import Redis from 'ioredis';
import pg from 'pg';
import { Sequelize, Options } from 'sequelize';

import { DbModels } from './db';
import initModels from './models';
import config from '../config';
import { Logger } from '../utils/logger';

let logging:
    | boolean
    | ((sql: string, timing?: number | undefined) => void)
    | undefined;
if (process.env.NODE_ENV === 'development') {
    logging = (msg, timing) =>
        console.log(
            `\n\x1b[46mQUERY:\x1b[0m ${msg} \x1b[7mTIME:\x1b[0m\x1b[100m ${timing}ms\x1b[0m`
        );
} else {
    logging = (msg) => Logger.verbose(msg);
}
const dbConfig: Options = {
    dialect: 'postgres',
    dialectOptions: {
        connectTimeout: 60000,
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    dialectModule: pg,
    pool: {
        max: config.maxDatabasePoolConnections,
        min: 0,
        acquire: 60000,
        idle: 15000,
    },
    protocol: 'postgres',
    native: !config.aws.lambda, // if lambda = true, then native = false
    logging,
    benchmark: process.env.NODE_ENV === 'development',
};
const sequelize = new Sequelize(config.dbUrl, dbConfig);
initModels(sequelize);

const models = sequelize.models as DbModels;

let redisClient: Redis = undefined as any;

if (process.env.NODE_ENV !== 'test') {
    redisClient = new Redis(config.redis);
}

export { sequelize, Sequelize, models, redisClient };
