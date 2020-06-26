import { Sequelize } from 'sequelize';
import { initializeCommunity, Community } from './community';
import { initializeTransactions } from './transactions';
import { initializeUser } from './user';
import { initializeSSI, SSI } from './ssi';


export default function initModels(sequelize: Sequelize) {
    initializeCommunity(sequelize);
    initializeSSI(sequelize);
    initializeTransactions(sequelize);
    initializeUser(sequelize);

    Community.hasMany(SSI, { foreignKey: 'communityId' });
    SSI.belongsTo(Community);
}