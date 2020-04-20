import { Sequelize } from 'sequelize';
import config from '../config';
import { initializeCommunity, Community } from '../models/community';
import IDatabase from '../types';


export default async (): Promise<Sequelize> => {
    const sequelize = new Sequelize(config.db.dbName, config.db.user, config.db.pass, {
        host: config.db.host,
        dialect: 'postgres',

        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
    });
    await sequelize.authenticate();
    initializeCommunity(sequelize);
    return sequelize;
};