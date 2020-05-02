import { Sequelize } from 'sequelize';
import { initializeCommunity } from './community';
import { initializeTransactions } from './transactions';
import { initializeBeneficiary } from './beneficiary';


export default function initModels(sequelize: Sequelize) {
    initializeCommunity(sequelize);
    initializeTransactions(sequelize);
    initializeBeneficiary(sequelize);
}