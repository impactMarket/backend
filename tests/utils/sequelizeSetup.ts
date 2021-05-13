import { Options, Sequelize } from 'sequelize';

import config from '../../src/config';
import initModels from '../../src/database/models';

export function sequelizeSetup() {
    const dbConfig: Options = {
        dialect: 'postgres',
        dialectOptions: {
            connectTimeout: 60000,
        },
        pool: {
            max: 30,
            min: 0,
            acquire: 60000,
            idle: 5000,
        },
        protocol: 'postgres',
        native: true,
        // logging,
        // query: { raw: true }, // I wish, eager loading gets fixed
    };
    const sequelize = new Sequelize(config.dbUrl, dbConfig);
    initModels(sequelize);
    return sequelize;
}
