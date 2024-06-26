import { Sequelize } from 'sequelize';

import { communityAssociation } from './associations/community';
import { initializeAirgrabProof } from './airgrab/airgrabProof';
import { initializeAirgrabUser } from './airgrab/airgrabUser';
import { initializeAppAnonymousReport } from './app/anonymousReport';
import { initializeAppCICOProvider } from './cico/providers';
import { initializeAppClientCredential } from './app/appClientCredential';
import { initializeAppExchangeRates } from './app/exchangeRates';
import { initializeAppLazyAgenda } from './app/appLazyAgenda';
import { initializeAppLog } from './app/appLog';
import { initializeAppNotification } from './app/appNotification';
import { initializeAppProposal } from './app/appProposal';
import { initializeAppReferralCode } from './app/appReferralCode';
import { initializeAppUser } from './app/appUser';
import { initializeAppUserValidationCode } from './app/appUserValidationCode';
import { initializeCommunity } from './ubi/community';
import { initializeCronJobExecuted } from './app/cronJobExecuted';
import { initializeExchangeRegistry } from './exchange/exchangeRegistry';
import { initializeGlobalDailyState } from './global/globalDailyState';
import { initializeGlobalDemographics } from './global/globalDemographics';
import { initializeGlobalGrowth } from './global/globalGrowth';
import { initializeImMetadata } from './app/imMetadata';
import { initializeLearnAndEarnCategory } from './learnAndEarn/learnAndEarnCategory';
import { initializeLearnAndEarnLesson } from './learnAndEarn/learnAndEarnLesson';
import { initializeLearnAndEarnLevel } from './learnAndEarn/learnAndEarnLevel';
import { initializeLearnAndEarnPayment } from './learnAndEarn/learnAndEarnPayment';
import { initializeLearnAndEarnPrismicLesson } from './learnAndEarn/learnAndEarnPrismicLesson';
import { initializeLearnAndEarnPrismicLevel } from './learnAndEarn/learnAndEarnPrismicLevel';
import { initializeLearnAndEarnQuiz } from './learnAndEarn/learnAndEarnQuiz';
import { initializeLearnAndEarnUserCategory } from './learnAndEarn/learnAndEarnUserCategory';
import { initializeLearnAndEarnUserData } from './learnAndEarn/learnAndEarnUserData';
import { initializeLearnAndEarnUserLesson } from './learnAndEarn/learnAndEarnUserLesson';
import { initializeLearnAndEarnUserLevel } from './learnAndEarn/learnAndEarnUserLevel';
import { initializeMerchantCommunity } from './merchant/merchantCommunity';
import { initializeMerchantRegistry } from './merchant/merchantRegistry';
import { initializeMicroCreditApplication } from './microCredit/applications';
import { initializeMicroCreditBorrowers } from './microCredit/borrowers';
import { initializeMicroCreditBorrowersHuma } from './microCredit/borrowersHuma';
import { initializeMicroCreditDocs } from './microCredit/docs';
import { initializeMicroCreditLoanManager } from './microCredit/loanManagers';
import { initializeMicroCreditNote } from './microCredit/note';
import { initializeStoryComment } from './story/storyComment';
import { initializeStoryCommunity } from './story/storyCommunity';
import { initializeStoryContent } from './story/storyContent';
import { initializeStoryEngagement } from './story/storyEngagement';
import { initializeStoryUserEngagement } from './story/storyUserEngagement';
import { initializeStoryUserReport } from './story/storyUserReport';
import { initializeSubgraphMicroCreditBorrowers } from './microCredit/subgraphBorrowers';
import { initializeSubgraphUBIBeneficiary } from './ubi/subgraphUBIBeneficiary';
import { initializeSubgraphUBICommunity } from './ubi/subgraphUBICommunity';
import { initializeUbiBeneficiarySurvey } from './ubi/ubiBeneficiarySurvey';
import { initializeUbiClaimLocation } from './ubi/ubiClaimLocation';
import { initializeUbiCommunityCampaign } from './ubi/ubiCommunityCampaign';
import { initializeUbiCommunityContract } from './ubi/communityContract';
import { initializeUbiCommunityDailyMetrics } from './ubi/communityDailyMetrics';
import { initializeUbiCommunityDemographics } from './ubi/communityDemographics';
import { initializeUbiCommunityLabel } from './ubi/ubiCommunityLabel';
import { initializeUbiCommunityPromoter } from './ubi/ubiCommunityPromoter';
import { initializeUbiCommunitySuspect } from './ubi/ubiCommunitySuspect';
import { initializeUbiPromoter } from './ubi/ubiPromoter';
import { initializeUbiPromoterSocialMedia } from './ubi/ubiPromoterSocialMedia';
import { initializeWalletAirdropProof } from './walletAirdrop/walletAirdropProof';
import { initializeWalletAirdropUser } from './walletAirdrop/walletAirdropUser';
import { learnAndEarnAssociation } from './associations/learnAndEarn';
import { storyAssociation } from './associations/story';
import { userAssociation } from './associations/user';
import { walletAidropAssociation } from './associations/walletAirdrop';

export default function initModels(sequelize: Sequelize): void {
    // app
    initializeAppUser(sequelize);
    initializeAppExchangeRates(sequelize);
    initializeImMetadata(sequelize);
    initializeAppAnonymousReport(sequelize);
    initializeCronJobExecuted(sequelize);
    initializeAppNotification(sequelize);
    initializeUbiBeneficiarySurvey(sequelize);
    initializeAppProposal(sequelize);
    initializeAppClientCredential(sequelize);
    initializeAppLog(sequelize);
    initializeAppUserValidationCode(sequelize);
    initializeAppReferralCode(sequelize);
    initializeAppCICOProvider(sequelize);
    initializeAppLazyAgenda(sequelize);

    // ubi
    initializeCommunity(sequelize);
    initializeUbiCommunityContract(sequelize);
    initializeUbiCommunityDailyMetrics(sequelize);
    initializeUbiCommunityDemographics(sequelize);
    initializeUbiCommunitySuspect(sequelize);
    initializeUbiClaimLocation(sequelize);
    initializeUbiCommunityPromoter(sequelize);
    initializeUbiPromoter(sequelize);
    initializeUbiPromoterSocialMedia(sequelize);
    initializeUbiCommunityLabel(sequelize);
    initializeUbiCommunityCampaign(sequelize);
    initializeSubgraphUBICommunity(sequelize);
    initializeSubgraphUBIBeneficiary(sequelize);

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
    initializeLearnAndEarnUserData(sequelize);

    // MicroCredit
    initializeMicroCreditApplication(sequelize);
    initializeMicroCreditDocs(sequelize);
    initializeMicroCreditBorrowers(sequelize);
    initializeMicroCreditBorrowersHuma(sequelize);
    initializeMicroCreditNote(sequelize);
    initializeSubgraphMicroCreditBorrowers(sequelize);
    initializeMicroCreditLoanManager(sequelize);

    // Exchange
    initializeExchangeRegistry(sequelize);

    // associations
    userAssociation(sequelize);
    communityAssociation(sequelize);
    storyAssociation(sequelize);
    walletAidropAssociation(sequelize);
    learnAndEarnAssociation(sequelize);
}
