import { Sequelize } from 'sequelize';

import { initializeAirgrabProof } from './airgrab/airgrabProof';
import { initializeAirgrabUser } from './airgrab/airgrabUser';
import { initializeAgenda } from './app/agenda';
import { initializeAppAnonymousReport } from './app/anonymousReport';
import { initializeAppMediaContent } from './app/appMediaContent';
import { initializeAppMediaThumbnail } from './app/appMediaThumbnail';
import { initializeAppNotification } from './app/appNotification';
import { initializeAppProposal } from './app/appProposal';
import { initializeAppUser } from './app/appUser';
import { initializeAppUserThroughTrust } from './app/appUserThroughTrust';
import { initializeAppUserTrust } from './app/appUserTrust';
import { initializeCronJobExecuted } from './app/cronJobExecuted';
import { initializeExchangeRates } from './app/exchangeRates';
import { initializeImMetadata } from './app/imMetadata';
import { airgrabAssociation } from './associations/airgrab';
import { appAssociation } from './associations/app';
import { communityAssociation } from './associations/community';
import { storyAssociation } from './associations/story';
import { userAssociation } from './associations/user';
import { initializeGlobalDailyState } from './global/globalDailyState';
import { initializeGlobalDemographics } from './global/globalDemographics';
import { initializeGlobalGrowth } from './global/globalGrowth';
import { initializeReachedAddress } from './reachedAddress';
import { initializeStoryCommunity } from './story/storyCommunity';
import { initializeStoryContent } from './story/storyContent';
import { initializeStoryEngagement } from './story/storyEngagement';
import { initializeStoryUserEngagement } from './story/storyUserEngagement';
import { initializeStoryUserReport } from './story/storyUserReport';
import { initializeBeneficiary } from './ubi/beneficiary';
import { initializeCommunity } from './ubi/community';
import { initializeUbiCommunityContract } from './ubi/communityContract';
import { initializeUbiCommunityDailyMetrics } from './ubi/communityDailyMetrics';
import { initializeUbiCommunityDailyState } from './ubi/communityDailyState';
import { initializeUbiCommunityDemographics } from './ubi/communityDemographics';
import { initializeInflow } from './ubi/inflow';
import { initializeManager } from './ubi/manager';
import { initializeUbiRequestChangeParams } from './ubi/requestChangeParams';
import { initializeUbiBeneficiaryRegistry } from './ubi/ubiBeneficiaryRegistry';
import { initializeUbiBeneficiarySurvey } from './ubi/ubiBeneficiarySurvey';
import { initializeUbiBeneficiaryTransaction } from './ubi/ubiBeneficiaryTransaction';
import { initializeUbiClaim } from './ubi/ubiClaim';
import { initializeUbiClaimLocation } from './ubi/ubiClaimLocation';
import { initializeUbiCommunityCampaign } from './ubi/ubiCommunityCampaign';
import { initializeUbiCommunityLabel } from './ubi/ubiCommunityLabel';
import { initializeUbiCommunityPromoter } from './ubi/ubiCommunityPromoter';
import { initializeUbiCommunitySuspect } from './ubi/ubiCommunitySuspect';
import { initializeUbiPromoter } from './ubi/ubiPromoter';
import { initializeUbiPromoterSocialMedia } from './ubi/ubiPromoterSocialMedia';

export default function initModels(sequelize: Sequelize): void {
    // app
    initializeAppUser(sequelize);
    initializeAppUserTrust(sequelize);
    initializeAppUserThroughTrust(sequelize);
    initializeAgenda(sequelize);
    initializeExchangeRates(sequelize);
    initializeImMetadata(sequelize);
    initializeAppAnonymousReport(sequelize);
    initializeCronJobExecuted(sequelize);
    initializeAppMediaContent(sequelize);
    initializeAppMediaThumbnail(sequelize);
    initializeAppNotification(sequelize);
    initializeUbiBeneficiarySurvey(sequelize);
    initializeAppProposal(sequelize);

    // ubi
    initializeCommunity(sequelize);
    initializeUbiCommunityContract(sequelize);
    initializeUbiCommunityDailyState(sequelize);
    initializeUbiCommunityDailyMetrics(sequelize);
    initializeUbiCommunityDemographics(sequelize);
    initializeUbiCommunitySuspect(sequelize);
    initializeUbiRequestChangeParams(sequelize);
    initializeUbiClaimLocation(sequelize);
    initializeManager(sequelize);
    initializeBeneficiary(sequelize);
    initializeUbiBeneficiaryRegistry(sequelize);
    initializeUbiBeneficiaryTransaction(sequelize);
    initializeUbiClaim(sequelize);
    initializeInflow(sequelize);
    initializeUbiCommunityPromoter(sequelize);
    initializeUbiPromoter(sequelize);
    initializeUbiPromoterSocialMedia(sequelize);
    initializeUbiCommunityLabel(sequelize);
    initializeUbiCommunityCampaign(sequelize);

    // others
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

    // airgrab
    initializeAirgrabUser(sequelize);
    initializeAirgrabProof(sequelize);

    // associations
    userAssociation(sequelize);
    communityAssociation(sequelize);
    storyAssociation(sequelize);
    appAssociation(sequelize);
    airgrabAssociation(sequelize);
}
