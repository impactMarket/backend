import { Sequelize } from 'sequelize';

import { initializeAgenda } from './app/agenda';
import { initializeSubscribers } from './app/subscribers';
import { initializeBeneficiary } from './ubi/beneficiary';
import { initializeBeneficiaryTransaction } from './ubi/beneficiaryTransaction';
import { initializeClaim } from './ubi/claim';
import { initializeClaimLocation } from './ubi/claimLocation';
import { initializeCommunity } from './ubi/community';
import { initializeCommunityContract } from './ubi/communityContract';
import { initializeCommunityDailyMetrics } from './ubi/communityDailyMetrics';
import { initializeCommunityDailyState } from './ubi/communityDailyState';
import { initializeCommunityState } from './ubi/communityState';
import { initializeUbiRequestChangeParams } from './ubi/requestChangeParams';
import { initializeCronJobExecuted } from './app/cronJobExecuted';
import { initializeExchangeRates } from './app/exchangeRates';
import { initializeGlobalGrowth } from './global/globalGrowth';
import { initializeGlobalDailyState } from './global/globalDailyState';
import { initializeGlobalDemographics } from './global/globalDemographics';
import { initializeAppUserDevice } from './app/userDevice';
import { initializeImMetadata } from './app/imMetadata';
import { initializeInflow } from './ubi/inflow';
import { initializeManager } from './ubi/manager';
import { initializeMobileError } from './app/mobileError';
import { initializeNotifiedBacker } from './notifiedBacker';
import { initializeReachedAddress } from './reachedAddress';
import { initializeSSI } from './ssi';
import { initializeTransactions } from './transactions';
import initializeUser from './app/user';
import { initializeStoryContent } from './story/storyContent';
import { initializeStoryCommunity } from './story/storyCommunity';
import { initializeStoryEngagement } from './story/storyEngagement';
import { initializeStoryUserEngagement } from './story/storyUserEngagement';
import { initializeAppAnonymousReport } from './app/anonymousReport';
import { initializeStoryUserReport } from './story/storyUserReport';
import { userAssociation } from './associations/user';
import { initializeAppUserThroughTrust } from './app/appUserThroughTrust';
import { initializeAppUserTrust } from './app/appUserTrust';
import { communityAssociation } from './associations/community';
import { initializeUbiCommunitySuspect } from './ubi/ubiCommunitySuspect';
import { storyAssociation } from './associations/story';

export default function initModels(sequelize: Sequelize): void {
    // app
    initializeUser(sequelize);
    initializeSubscribers(sequelize);
    initializeAppUserTrust(sequelize);
    initializeAppUserThroughTrust(sequelize);
    initializeAppUserDevice(sequelize);
    initializeAgenda(sequelize);
    initializeExchangeRates(sequelize);
    initializeImMetadata(sequelize);
    initializeAppAnonymousReport(sequelize);
    initializeMobileError(sequelize);
    initializeCronJobExecuted(sequelize);

    // ubi
    initializeCommunity(sequelize);
    initializeCommunityState(sequelize);
    initializeCommunityContract(sequelize);
    initializeCommunityDailyState(sequelize);
    initializeCommunityDailyMetrics(sequelize);
    initializeUbiCommunitySuspect(sequelize);
    initializeUbiRequestChangeParams(sequelize);
    initializeClaimLocation(sequelize);
    initializeManager(sequelize);
    initializeBeneficiary(sequelize);
    initializeBeneficiaryTransaction(sequelize);
    initializeClaim(sequelize);
    initializeInflow(sequelize);

    // others
    initializeNotifiedBacker(sequelize);
    initializeReachedAddress(sequelize);

    // global
    initializeGlobalDailyState(sequelize);
    initializeGlobalDemographics(sequelize);
    initializeGlobalGrowth(sequelize);

    // story
    initializeStoryContent(sequelize);
    initializeStoryCommunity(sequelize);
    initializeStoryEngagement(sequelize);
    initializeStoryUserEngagement(sequelize);
    initializeStoryUserReport(sequelize);

    // associations
    userAssociation(sequelize);
    communityAssociation(sequelize);
    storyAssociation(sequelize);

    // deprecated
    initializeSSI(sequelize);
    initializeTransactions(sequelize);
}
