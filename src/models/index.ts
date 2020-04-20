import { Sequelize } from 'sequelize';
import { initializeCommunity } from './community';
import { initializeTransactions } from './transactions';


export default function initModels(sequelize: Sequelize) {
    initializeCommunity(sequelize);
    initializeTransactions(sequelize);
}