import { Sequelize } from 'sequelize';
import { initializeCommunity, Community } from './community';
import { initializeTransactions } from './transactions';
import { initializeUser } from './user';
import { initializeSSI, SSI } from './ssi';
import { initializeAgenda } from './agenda';
import { initializeClaimLocation } from './claimLocation';


export default function initModels(sequelize: Sequelize): void {
    initializeCommunity(sequelize);
    initializeSSI(sequelize);
    initializeTransactions(sequelize);
    initializeUser(sequelize);
    initializeAgenda(sequelize);
    initializeClaimLocation(sequelize);

    Community.hasMany(SSI, { foreignKey: 'communityPublicId' });
    SSI.belongsTo(Community, { foreignKey: 'communityPublicId' });
}