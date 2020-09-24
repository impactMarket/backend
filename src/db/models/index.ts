import { Sequelize } from 'sequelize';
import { initializeCommunity, Community } from './community';
import { initializeTransactions } from './transactions';
import { initializeUser } from './user';
import { initializeSSI, SSI } from './ssi';
import { initializeAgenda } from './agenda';
import { ClaimLocation, initializeClaimLocation } from './claimLocation';
import { initializeGlobalStatus } from './globalStatus';
import { initializeExchangeRates } from './exchangeRates';


export default function initModels(sequelize: Sequelize): void {
    initializeCommunity(sequelize);
    initializeSSI(sequelize);
    initializeTransactions(sequelize);
    initializeUser(sequelize);
    initializeAgenda(sequelize);
    initializeClaimLocation(sequelize);
    initializeGlobalStatus(sequelize);
    initializeExchangeRates(sequelize);

    Community.hasMany(SSI, { foreignKey: 'communityPublicId' });
    Community.hasMany(ClaimLocation, { foreignKey: 'communityPublicId' });
    SSI.belongsTo(Community, { foreignKey: 'communityPublicId' });
    ClaimLocation.belongsTo(Community, { foreignKey: 'communityPublicId' });
}