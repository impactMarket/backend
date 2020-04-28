import { Sequelize, Options } from 'sequelize';
import config from '../config';
import { initializeCommunity } from '../models/community';
import { initializeTransactions } from '../models/transactions';
import { initializeBeneficiary } from '../models/beneficiary';


export default async (): Promise<Sequelize> => {
    const dbConfig: Options = {
        dialect: 'postgres',
        protocol: 'postgres',
        native: true,
    };
    const sequelize = new Sequelize(config.dbUrl, dbConfig);
    await sequelize.authenticate();
    initializeCommunity(sequelize);
    initializeBeneficiary(sequelize);
    initializeTransactions(sequelize);
    return sequelize;
};