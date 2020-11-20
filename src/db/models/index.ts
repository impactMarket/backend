import { Sequelize } from 'sequelize';
import { initializeCommunity, Community } from './community';
import { initializeTransactions } from './transactions';
import { initializeUser, User } from './user';
import { initializeSSI } from './ssi';
import { initializeAgenda } from './agenda';
import { ClaimLocation, initializeClaimLocation } from './claimLocation';
import { initializeExchangeRates } from './exchangeRates';
import { initializeNotifiedBacker, NotifiedBacker } from './notifiedBacker';
import { initializeImMetadata } from './imMetadata';
import { Beneficiary, initializeBeneficiary } from './beneficiary';
import { initializeManager, Manager } from './manager';
import { Claim, initializeClaim } from './claim';
import { Inflow, initializeInflow } from './inflow';
import { CommunityState, initializeCommunityState } from './communityState';
import { CommunityDailyState, initializeCommunityDailyState } from './communityDailyState';
import { CommunityDailyMetrics, initializeCommunityDailyMetrics } from './communityDailyMetrics';
import { initializeMobileError } from './mobileError';
import { CommunityContract, initializeCommunityContract } from './communityContract';
import { initializeGlobalDailyState } from './globalDailyState';
import { initializeReachedAddress } from './reachedAddress';
import { initializeCronJobExecuted } from './cronJobExecuted';
import { initializeBeneficiaryTransaction } from './beneficiaryTransaction';


export default function initModels(sequelize: Sequelize): void {
    initializeCommunity(sequelize);
    initializeSSI(sequelize);
    initializeTransactions(sequelize);
    initializeUser(sequelize);
    initializeAgenda(sequelize);
    initializeClaimLocation(sequelize);
    initializeExchangeRates(sequelize);
    initializeNotifiedBacker(sequelize);
    initializeImMetadata(sequelize);
    initializeBeneficiary(sequelize);
    initializeManager(sequelize);
    initializeClaim(sequelize);
    initializeInflow(sequelize);
    initializeCommunityState(sequelize);
    initializeCommunityDailyState(sequelize);
    initializeCommunityDailyMetrics(sequelize);
    initializeMobileError(sequelize);
    initializeCommunityContract(sequelize);
    initializeGlobalDailyState(sequelize);
    initializeReachedAddress(sequelize);
    initializeCronJobExecuted(sequelize);
    initializeBeneficiaryTransaction(sequelize);

    ClaimLocation.belongsTo(Community, {
        foreignKey: 'communityId',  // ClaimLocation.communityId
        targetKey: 'publicId', // the Community.publicId
    });

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

    Claim.belongsTo(Community, {
        foreignKey: 'communityId',  // Claim.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    Inflow.belongsTo(Community, {
        foreignKey: 'communityId',  // Inflow.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    CommunityState.belongsTo(Community, {
        foreignKey: 'communityId',  // CommunityState.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    CommunityDailyState.belongsTo(Community, {
        foreignKey: 'communityId',  // CommunityDailyState.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    CommunityDailyMetrics.belongsTo(Community, {
        foreignKey: 'communityId',  // CommunityDailyMetrics.communityId
        targetKey: 'publicId', // the Community.publicId
    });

    CommunityContract.belongsTo(Community, {
        foreignKey: 'communityId',  // CommunityContract.communityId
        targetKey: 'publicId', // the Community.publicId
    });
}