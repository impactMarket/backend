import { Sequelize } from 'sequelize';
import { initializeCommunity, Community } from './community';
import { initializeTransactions } from './transactions';
import { initializeUser } from './user';
import { initializeSSI, SSI } from './ssi';
import { initializeAgenda } from './agenda';
import { ClaimLocation, initializeClaimLocation } from './claimLocation';
import { initializeGlobalStatus } from './globalStatus';
import { initializeExchangeRates } from './exchangeRates';
import { initializeNotifiedBackers, NotifiedBackers } from './notifiedBackers';
import { initializeImMetadata } from './imMetadata';
import { Beneficiary, initializeBeneficiary } from './beneficiary';


export default function initModels(sequelize: Sequelize): void {
    initializeCommunity(sequelize);
    initializeSSI(sequelize);
    initializeTransactions(sequelize);
    initializeUser(sequelize);
    initializeAgenda(sequelize);
    initializeClaimLocation(sequelize);
    initializeGlobalStatus(sequelize);
    initializeExchangeRates(sequelize);
    initializeNotifiedBackers(sequelize);
    initializeImMetadata(sequelize);
    initializeNotifiedBackers(sequelize);
    initializeBeneficiary(sequelize);

    Community.hasMany(SSI, { foreignKey: 'communityPublicId' });
    SSI.belongsTo(Community, { foreignKey: 'communityPublicId' });

    Community.hasMany(ClaimLocation, { foreignKey: 'communityPublicId' });
    ClaimLocation.belongsTo(Community, { foreignKey: 'communityPublicId' });

    Beneficiary.belongsTo(Community, {
        foreignKey: 'communityId',  // Beneficiary.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    NotifiedBackers.belongsTo(Community, {
        foreignKey: 'communityId',  // NotifiedBacker.communityId
        targetKey: 'publicId', // the Community.publicId
    });
}