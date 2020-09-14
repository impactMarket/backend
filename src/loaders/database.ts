import { Sequelize, Options } from 'sequelize';
import config from '../config';
import initModels from '../db/models';
import Logger from '../loaders/logger';


export default async (): Promise<Sequelize> => {
    let logging: boolean | ((sql: string, timing?: number | undefined) => void) | undefined;
    if (process.env.NODE_ENV === 'development') {
        logging = (msg) => false;
    } else {
        logging = (msg) => Logger.debug(msg);
    }
    const dbConfig: Options = {
        dialect: 'postgres',
        protocol: 'postgres',
        native: true,
        logging,
        // query: { raw: true },
    };
    const sequelize = new Sequelize(config.dbUrl, dbConfig);
    await sequelize.authenticate();
    initModels(sequelize);
    return sequelize;
};