import { Sequelize } from 'sequelize';
import { initializeCommunity } from './community';
import { initializeTransactions } from './transactions';
import { initializeBeneficiary } from './beneficiary';
import { initializeCommunityCreation } from './communityCreation';


export default function initModels(sequelize: Sequelize) {
    initializeCommunity(sequelize);
    initializeTransactions(sequelize);
    initializeBeneficiary(sequelize);
    initializeCommunityCreation(sequelize);
}