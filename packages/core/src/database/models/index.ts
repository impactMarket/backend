import { Sequelize } from 'sequelize';

import { initializeAirgrabProof } from './airgrab/airgrabProof';
import { initializeAirgrabUser } from './airgrab/airgrabUser';
import { initializeAppAnonymousReport } from './app/anonymousReport';
import { initializeAppClientCredential } from './app/appClientCredential';
import { initializeAppLog } from './app/appLog';
import { initializeAppNotification } from './app/appNotification';
import { initializeAppProposal } from './app/appProposal';
import { initializeAppUser } from './app/appUser';
import { initializeAppUserValidationCode } from './app/appUserValidationCode';
import { initializeCronJobExecuted } from './app/cronJobExecuted';
import { initializeExchangeRates } from './app/exchangeRates';
import { initializeImMetadata } from './app/imMetadata';
import { airgrabAssociation } from './associations/airgrab';
import { communityAssociation } from './associations/community';
import { learnAndEarnAssociation } from './associations/learnAndEarn';
import { storyAssociation } from './associations/story';
import { userAssociation } from './associations/user';
import { walletAidropAssociation } from './associations/walletAirdrop';
import { initializeExchangeRegistry } from './exchange/exchangeRegistry';
import { initializeGlobalDailyState } from './global/globalDailyState';
import { initializeGlobalDemographics } from './global/globalDemographics';
import { initializeGlobalGrowth } from './global/globalGrowth';
import { initializeLearnAndEarnCategory } from './learnAndEarn/learnAndEarnCategory';
import { initializeLearnAndEarnLesson } from './learnAndEarn/learnAndEarnLesson';
import { initializeLearnAndEarnLevel } from './learnAndEarn/learnAndEarnLevel';
import { initializeLearnAndEarnPayment } from './learnAndEarn/learnAndEarnPayment';
import { initializeLearnAndEarnQuiz } from './learnAndEarn/learnAndEarnQuiz';
import { initializeLearnAndEarnUserCategory } from './learnAndEarn/learnAndEarnUserCategory';
import { initializeLearnAndEarnUserLesson } from './learnAndEarn/learnAndEarnUserLesson';
import { initializeLearnAndEarnUserLevel } from './learnAndEarn/learnAndEarnUserLevel';
import { initializeMerchantCommunity } from './merchant/merchantCommunity';
import { initializeMerchantRegistry } from './merchant/merchantRegistry';
import { initializeStoryComment } from './story/storyComment';
import { initializeStoryCommunity } from './story/storyCommunity';
import { initializeStoryContent } from './story/storyContent';
import { initializeStoryEngagement } from './story/storyEngagement';
import { initializeStoryUserEngagement } from './story/storyUserEngagement';
import { initializeStoryUserReport } from './story/storyUserReport';
import { initializeBeneficiary } from './ubi/beneficiary';
import { initializeCommunity } from './ubi/community';
import { initializeUbiCommunityContract } from './ubi/communityContract';
import { initializeUbiCommunityDailyMetrics } from './ubi/communityDailyMetrics';
import { initializeUbiCommunityDemographics } from './ubi/communityDemographics';
import { initializeManager } from './ubi/manager';
import { initializeUbiBeneficiarySurvey } from './ubi/ubiBeneficiarySurvey';
import { initializeUbiClaimLocation } from './ubi/ubiClaimLocation';
import { initializeUbiCommunityCampaign } from './ubi/ubiCommunityCampaign';
import { initializeUbiCommunityLabel } from './ubi/ubiCommunityLabel';
import { initializeUbiCommunityPromoter } from './ubi/ubiCommunityPromoter';
import { initializeUbiCommunitySuspect } from './ubi/ubiCommunitySuspect';
import { initializeUbiPromoter } from './ubi/ubiPromoter';
import { initializeUbiPromoterSocialMedia } from './ubi/ubiPromoterSocialMedia';
import { initializeWalletAirdropProof } from './walletAirdrop/walletAirdropProof';
import { initializeWalletAirdropUser } from './walletAirdrop/walletAirdropUser';

export default function initModels(sequelize: Sequelize): void {
    // app
    initializeAppUser(sequelize);
    initializeExchangeRates(sequelize);
    initializeImMetadata(sequelize);
    initializeAppAnonymousReport(sequelize);
    initializeCronJobExecuted(sequelize);
    initializeAppNotification(sequelize);
    initializeUbiBeneficiarySurvey(sequelize);
    initializeAppProposal(sequelize);
    initializeAppClientCredential(sequelize);
    initializeAppLog(sequelize);
    initializeAppUserValidationCode(sequelize);

    // ubi
    initializeCommunity(sequelize);
    initializeUbiCommunityContract(sequelize);
    initializeUbiCommunityDailyMetrics(sequelize);
    initializeUbiCommunityDemographics(sequelize);
    initializeUbiCommunitySuspect(sequelize);
    initializeUbiClaimLocation(sequelize);
    initializeManager(sequelize);
    initializeBeneficiary(sequelize);
    initializeUbiCommunityPromoter(sequelize);
    initializeUbiPromoter(sequelize);
    initializeUbiPromoterSocialMedia(sequelize);
    initializeUbiCommunityLabel(sequelize);
    initializeUbiCommunityCampaign(sequelize);

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
    initializeStoryComment(sequelize);

    // airgrab
    initializeAirgrabUser(sequelize);
    initializeAirgrabProof(sequelize);

    // wallet airdrop
    initializeWalletAirdropUser(sequelize);
    initializeWalletAirdropProof(sequelize);

    // merchant
    initializeMerchantRegistry(sequelize);
    initializeMerchantCommunity(sequelize);

    // L&E
    initializeLearnAndEarnCategory(sequelize);
    initializeLearnAndEarnLesson(sequelize);
    initializeLearnAndEarnLevel(sequelize);
    initializeLearnAndEarnQuiz(sequelize);
    initializeLearnAndEarnUserCategory(sequelize);
    initializeLearnAndEarnUserLesson(sequelize);
    initializeLearnAndEarnUserLevel(sequelize);
    initializeLearnAndEarnPayment(sequelize);

    // Exchange
    initializeExchangeRegistry(sequelize);

    // associations
    userAssociation(sequelize);
    communityAssociation(sequelize);
    storyAssociation(sequelize);
    airgrabAssociation(sequelize);
    walletAidropAssociation(sequelize);
    learnAndEarnAssociation(sequelize);
}
