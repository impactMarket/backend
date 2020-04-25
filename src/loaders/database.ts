import { Sequelize } from 'sequelize';
import config from '../config';
import { initializeCommunity } from '../models/community';
import { initializeTransactions } from '../models/transactions';


export default async (): Promise<Sequelize> => {
    const sequelize = new Sequelize(config.dbUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        native: true,
        ssl: config.dbUrl.indexOf('localhost') === -1,
        dialectOptions: {
            ssl: config.dbUrl.indexOf('localhost') === -1,
        },
    });
    await sequelize.authenticate();
    initializeCommunity(sequelize);
    initializeTransactions(sequelize);
    return sequelize;
};