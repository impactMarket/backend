import { DataTypes, Sequelize } from 'sequelize';

import { initializeAgenda } from './agenda';
import { Beneficiary, initializeBeneficiary } from './beneficiary';
import { initializeBeneficiaryTransaction } from './beneficiaryTransaction';
import { Claim, initializeClaim } from './claim';
import { ClaimLocation, initializeClaimLocation } from './claimLocation';
import { initializeCommunity, Community } from './community';
import {
    CommunityContract,
    initializeCommunityContract,
} from './communityContract';
import {
    CommunityDailyMetrics,
    initializeCommunityDailyMetrics,
} from './communityDailyMetrics';
import {
    CommunityDailyState,
    initializeCommunityDailyState,
} from './communityDailyState';
import { CommunityState, initializeCommunityState } from './communityState';
import { initializeCronJobExecuted } from './cronJobExecuted';
import { initializeExchangeRates } from './exchangeRates';
import { initializeGlobalDailyState } from './globalDailyState';
import { initializeImMetadata } from './imMetadata';
import { Inflow, initializeInflow } from './inflow';
import { initializeManager, Manager } from './manager';
import { initializeMobileError } from './mobileError';
import { initializeNotifiedBacker, NotifiedBacker } from './notifiedBacker';
import { initializeReachedAddress } from './reachedAddress';
import { initializeSSI } from './ssi';
import { initializeTransactions } from './transactions';
import { initializeUser } from './user';

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

    // ClaimLocation.belongsTo(Community, {
    //     foreignKey: 'communityId', // ClaimLocation.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    // NotifiedBacker.belongsTo(Community, {
    //     foreignKey: 'communityId', // NotifiedBacker.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    // Beneficiary.belongsTo(Community, {
    //     foreignKey: 'communityId', // Beneficiary.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    // Manager.belongsTo(Community, {
    //     foreignKey: 'communityId', // Manager.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    sequelize.models.Manager.belongsTo(sequelize.models.User, {
        foreignKey: 'user',
        targetKey: 'address',
    });

    sequelize.models.User.hasOne(sequelize.models.Manager, {
        foreignKey: 'user',
    });

    // Manager.belongsTo(User, {
    //     foreignKey: 'user', // Manager.user
    //     targetKey: 'address', // the user.address
    // });

    // Claim.belongsTo(Community, {
    //     foreignKey: 'communityId', // Claim.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    // Inflow.belongsTo(Community, {
    //     foreignKey: 'communityId', // Inflow.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    // CommunityState.belongsTo(Community, {
    //     foreignKey: 'communityId', // CommunityState.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    // CommunityDailyState.belongsTo(Community, {
    //     foreignKey: 'communityId', // CommunityDailyState.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    // CommunityDailyMetrics.belongsTo(Community, {
    //     foreignKey: 'communityId', // CommunityDailyMetrics.communityId
    //     targetKey: 'publicId', // the Community.publicId
    // });

    // sequelize.models.CommunityContract.belongsTo(sequelize.models.Community, {
    //     foreignKey: {
    //         name: 'communityId',
    //         field: 
    //     }
    //     targetKey: 'publicId', // the Community.publicId
    //     keyType: DataTypes.UUID
    // });

    // sequelize.models.Community.hasOne(sequelize.models.CommunityContract, {
    //     foreignKey: 'communityId', // CommunityContract.communityId
    //     keyType: DataTypes.UUID
    // });
}
