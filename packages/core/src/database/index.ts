import { Options, Sequelize } from 'sequelize';
import Redis from 'ioredis';
import pg from 'pg';

import { DbModels } from './db';
import { Logger } from '../utils/logger';
import config from '../config';
import initModels from './models';

const databaseUriToObject = (uri: string) => {
    // not performant but not problematic
    const re = /postgres:\/\/(\w+):(\w+)@([\w-.]+):(\d+)\/(\w+)/i;
    const found = uri.match(re);
    if (found) {
        return {
            username: found[1],
            password: found[2],
            host: found[3],
            port: parseInt(found[4], 10),
            database: found[5]
        };
    }
    return {};
};

let logging: boolean | ((sql: string, timing?: number | undefined) => void) | undefined;
if (process.env.NODE_ENV === 'development') {
    logging = (msg, timing) =>
        console.log(`\n\x1b[46mQUERY:\x1b[0m ${msg} \x1b[7mTIME:\x1b[0m\x1b[100m ${timing}ms\x1b[0m`);
} else {
    logging = msg => Logger.verbose(msg);
}
const dbConfig: Options = {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    ...(config.database.replicas > 0
        ? {
              replication: {
                  read: [...Array(config.database.replicas)].map((_, i) =>
                      databaseUriToObject(process.env[`DATABASE_READ_REPLICA_${i + 1}_URL`]!)
                  ),
                  write: databaseUriToObject(config.database.main)
              }
          }
        : databaseUriToObject(config.database.main)),
    dialectModule: pg,
    pool: config.databasePool,
    protocol: 'postgres',
    native: !config.aws.lambda, // if lambda = true, then native = false
    logging,
    benchmark: process.env.NODE_ENV === 'development'
};
const sequelize = new Sequelize(dbConfig);
initModels(sequelize);

const models = sequelize.models as DbModels;

let redisClient: Redis = undefined as any;

if (process.env.NODE_ENV !== 'test') {
    if (config.aws.lambda) {
        redisClient = new Redis(config.redis, {
            tls: {
                rejectUnauthorized: false
            }
        });
    } else {
        redisClient = new Redis(config.redis);
    }
}

export { sequelize, Sequelize, models, redisClient };
