import { Sequelize } from 'sequelize';

import { initializeAirgrabProof } from './airgrab/airgrabProof';
import { initializeAirgrabUser } from './airgrab/airgrabUser';
import { initializeAgenda } from './app/agenda';
import { initializeAppAnonymousReport } from './app/anonymousReport';
import { initializeAppClientCredential } from './app/appClientCredential';
import { initializeAppLog } from './app/appLog';
import { initializeAppMediaContent } from './app/appMediaContent';
import { initializeAppMediaThumbnail } from './app/appMediaThumbnail';
import { initializeAppNotification } from './app/appNotification';
import { initializeAppProposal } from './app/appProposal';
import { initializeAppUser } from './app/appUser';
import { initializeAppUserThroughTrust } from './app/appUserThroughTrust';
import { initializeAppUserTrust } from './app/appUserTrust';
import { initializeAppUserValidationCode } from './app/appUserValidationCode';
import { initializeCronJobExecuted } from './app/cronJobExecuted';
import { initializeExchangeRates } from './app/exchangeRates';
import { initializeImMetadata } from './app/imMetadata';
import { airgrabAssociation } from './associations/airgrab';
import { appAssociation } from './associations/app';
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
import { initializeLearnAndEarnPrismicLevel } from './learnAndEarn/learnAndEarnPrismicLevel';
import { initializeLearnAndEarnPrismicLesson } from './learnAndEarn/learnAndEarnPrismicLesson';
import { initializeLearnAndEarnPayment } from './learnAndEarn/learnAndEarnPayment';
import { initializeLearnAndEarnQuiz } from './learnAndEarn/learnAndEarnQuiz';
import { initializeLearnAndEarnUserCategory } from './learnAndEarn/learnAndEarnUserCategory';
import { initializeLearnAndEarnUserLesson } from './learnAndEarn/learnAndEarnUserLesson';
import { initializeLearnAndEarnUserLevel } from './learnAndEarn/learnAndEarnUserLevel';
import { initializeMerchantCommunity } from './merchant/merchantCommunity';
import { initializeMerchantRegistry } from './merchant/merchantRegistry';
import { initializeReachedAddress } from './reachedAddress';
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
import { initializeUbiCommunityDailyState } from './ubi/communityDailyState';
import { initializeUbiCommunityDemographics } from './ubi/communityDemographics';
import { initializeInflow } from './ubi/inflow';
import { initializeManager } from './ubi/manager';
import { initializeUbiRequestChangeParams } from './ubi/requestChangeParams';
import { initializeUbiBeneficiaryRegistry } from './ubi/ubiBeneficiaryRegistry';
import { initializeUbiBeneficiarySurvey } from './ubi/ubiBeneficiarySurvey';
import { initializeUbiBeneficiaryTransaction } from './ubi/ubiBeneficiaryTransaction';
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
    initializeAppClientCredential(sequelize);
    initializeAppLog(sequelize);
    initializeAppUserValidationCode(sequelize);

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
    initializeLearnAndEarnPrismicLevel(sequelize);
    initializeLearnAndEarnPrismicLesson(sequelize);
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
    appAssociation(sequelize);
    airgrabAssociation(sequelize);
    walletAidropAssociation(sequelize);
    learnAndEarnAssociation(sequelize);
}
