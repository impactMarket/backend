import { Sequelize } from 'sequelize';

import { initializeAgenda } from './app/agenda';
import { initializeAppAnonymousReport } from './app/anonymousReport';
import { initializeAppUserThroughTrust } from './app/appUserThroughTrust';
import { initializeAppUserTrust } from './app/appUserTrust';
import { initializeCronJobExecuted } from './app/cronJobExecuted';
import { initializeExchangeRates } from './app/exchangeRates';
import { initializeImMetadata } from './app/imMetadata';
import { initializeMobileError } from './app/mobileError';
import { initializeSubscribers } from './app/subscribers';
import { initializeUser } from './app/user';
import { initializeAppUserDevice } from './app/userDevice';
import { communityAssociation } from './associations/community';
import { storyAssociation } from './associations/story';
import { userAssociation } from './associations/user';
import { initializeGlobalDailyState } from './global/globalDailyState';
import { initializeGlobalDemographics } from './global/globalDemographics';
import { initializeGlobalGrowth } from './global/globalGrowth';
import { initializeNotifiedBacker } from './notifiedBacker';
import { initializeReachedAddress } from './reachedAddress';
import { initializeSSI } from './ssi';
import { initializeStoryCommunity } from './story/storyCommunity';
import { initializeStoryContent } from './story/storyContent';
import { initializeStoryEngagement } from './story/storyEngagement';
import { initializeStoryUserEngagement } from './story/storyUserEngagement';
import { initializeStoryUserReport } from './story/storyUserReport';
import { initializeTransactions } from './transactions';
import { initializeBeneficiary } from './ubi/beneficiary';
import { initializeBeneficiaryTransaction } from './ubi/beneficiaryTransaction';
import { initializeClaim } from './ubi/claim';
import { initializeClaimLocation } from './ubi/claimLocation';
import { initializeCommunity } from './ubi/community';
import { initializeUbiCommunityContract } from './ubi/communityContract';
import { initializeUbiCommunityDailyMetrics } from './ubi/communityDailyMetrics';
import { initializeUbiCommunityDailyState } from './ubi/communityDailyState';
import { initializeUbiCommunityState } from './ubi/communityState';
import { initializeInflow } from './ubi/inflow';
import { initializeManager } from './ubi/manager';
import { initializeUbiRequestChangeParams } from './ubi/requestChangeParams';
import { initializeUbiCommunitySuspect } from './ubi/ubiCommunitySuspect';

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
    initializeUbiCommunityState(sequelize);
    initializeUbiCommunityContract(sequelize);
    initializeUbiCommunityDailyState(sequelize);
    initializeUbiCommunityDailyMetrics(sequelize);
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
