import { Sequelize } from 'sequelize';
import { initializeCommunity, Community } from './community';
import { initializeTransactions } from './transactions';
import { initializeUser, User } from './user';
import { initializeSSI, SSI } from './ssi';
import { initializeAgenda } from './agenda';
import { ClaimLocation, initializeClaimLocation } from './claimLocation';
import { initializeGlobalStatus } from './globalStatus';
import { initializeExchangeRates } from './exchangeRates';
import { initializeNotifiedBacker, NotifiedBacker } from './notifiedBacker';
import { initializeImMetadata } from './imMetadata';
import { Beneficiary, initializeBeneficiary } from './beneficiary';
import { initializeManager, Manager } from './manager';


export default function initModels(sequelize: Sequelize): void {
    initializeCommunity(sequelize);
    initializeSSI(sequelize);
    initializeTransactions(sequelize);
    initializeUser(sequelize);
    initializeAgenda(sequelize);
    initializeClaimLocation(sequelize);
    initializeGlobalStatus(sequelize);
    initializeExchangeRates(sequelize);
    initializeNotifiedBacker(sequelize);
    initializeImMetadata(sequelize);
    initializeNotifiedBacker(sequelize);
    initializeBeneficiary(sequelize);
    initializeManager(sequelize);

    Community.hasMany(SSI, { foreignKey: 'communityPublicId' });
    SSI.belongsTo(Community, { foreignKey: 'communityPublicId' });

    Community.hasMany(ClaimLocation, { foreignKey: 'communityPublicId' });
    ClaimLocation.belongsTo(Community, { foreignKey: 'communityPublicId' });

    NotifiedBacker.belongsTo(Community, {
        foreignKey: 'communityId',  // NotifiedBacker.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    Beneficiary.belongsTo(Community, {
        foreignKey: 'communityId',  // Beneficiary.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    Manager.belongsTo(Community, {
        foreignKey: 'communityId',  // Manager.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    Manager.belongsTo(User, {
        foreignKey: 'user',  // Manager.user
        targetKey: 'address', // the user.address
    });
}