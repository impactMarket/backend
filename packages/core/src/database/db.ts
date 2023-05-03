import { ModelCtor, Sequelize } from 'sequelize/types';

import { AirgrabProofModel } from './models/airgrab/airgrabProof';
import { AirgrabUserModel } from './models/airgrab/airgrabUser';
import { AppAnonymousReportModel } from './models/app/anonymousReport';
import { AppClientCredentialModel } from './models/app/appClientCredential';
import { AppLogModel } from './models/app/appLog';
import { AppNotificationModel } from './models/app/appNotification';
import { AppProposalModel } from './models/app/appProposal';
import { AppUserModel } from './models/app/appUser';
import { AppUserValidationCodeModel } from './models/app/appUserValidationCode';
import { CronJobExecuted } from './models/app/cronJobExecuted';
import { ExchangeRates } from './models/app/exchangeRates';
import { ImMetadata } from './models/app/imMetadata';
import { ExchangeRegistryModel } from './models/exchange/exchangeRegistry';
import { GlobalDailyState } from './models/global/globalDailyState';
import { GlobalDemographics } from './models/global/globalDemographics';
import { GlobalGrowthModel } from './models/global/globalGrowth';
import { LearnAndEarnCategoryModel } from './models/learnAndEarn/learnAndEarnCategory';
import { LearnAndEarnLessonModel } from './models/learnAndEarn/learnAndEarnLesson';
import { LearnAndEarnLevelModel } from './models/learnAndEarn/learnAndEarnLevel';
import { LearnAndEarnPrismicLevelModel } from './models/learnAndEarn/learnAndEarnPrismicLevel';
import { LearnAndEarnPrismicLessonModel } from './models/learnAndEarn/learnAndEarnPrismicLesson';
import { LearnAndEarnPaymentModel } from './models/learnAndEarn/learnAndEarnPayment';
import { LearnAndEarnQuizModel } from './models/learnAndEarn/learnAndEarnQuiz';
import { LearnAndEarnUserCategoryModel } from './models/learnAndEarn/learnAndEarnUserCategory';
import { LearnAndEarnUserLessonModel } from './models/learnAndEarn/learnAndEarnUserLesson';
import { LearnAndEarnUserLevelModel } from './models/learnAndEarn/learnAndEarnUserLevel';
import { MerchantCommunityModel } from './models/merchant/merchantCommunity';
import { MerchantRegistryModel } from './models/merchant/merchantRegistry';
import { StoryCommentModel } from './models/story/storyComment';
import { StoryCommunityModel } from './models/story/storyCommunity';
import { StoryContentModel } from './models/story/storyContent';
import { StoryEngagementModel } from './models/story/storyEngagement';
import { StoryUserEngagementModel } from './models/story/storyUserEngagement';
import { StoryUserReportModel } from './models/story/storyUserReport';
import { Beneficiary } from './models/ubi/beneficiary';
import { Community } from './models/ubi/community';
import { UbiCommunityContractModel } from './models/ubi/communityContract';
import { UbiCommunityDailyMetricsModel } from './models/ubi/communityDailyMetrics';
import { UbiCommunityDemographicsModel } from './models/ubi/communityDemographics';
import { Manager } from './models/ubi/manager';
import { UbiBeneficiarySurveyModel } from './models/ubi/ubiBeneficiarySurvey';
import { ClaimLocationModel } from './models/ubi/ubiClaimLocation';
import { UbiCommunityCampaignModel } from './models/ubi/ubiCommunityCampaign';
import { UbiCommunityLabelModel } from './models/ubi/ubiCommunityLabel';
import { UbiCommunitySuspectModel } from './models/ubi/ubiCommunitySuspect';
import { UbiPromoterModel } from './models/ubi/ubiPromoter';
import { UbiPromoterSocialMediaModel } from './models/ubi/ubiPromoterSocialMedia';
import { WalletAirdropProofModel } from './models/walletAirdrop/walletAirdropProof';
import { WalletAirdropUserModel } from './models/walletAirdrop/walletAirdropUser';

export interface DbModels {
    appUser: ModelCtor<AppUserModel>;
    appProposal: ModelCtor<AppProposalModel>;
    appLog: ModelCtor<AppLogModel>;
    appClientCredential: ModelCtor<AppClientCredentialModel>;
    anonymousReport: ModelCtor<AppAnonymousReportModel>;
    cronJobExecuted: ModelCtor<CronJobExecuted>;
    exchangeRates: ModelCtor<ExchangeRates>;
    imMetadata: ModelCtor<ImMetadata>;
    appNotification: ModelCtor<AppNotificationModel>;
    appUserValidationCode: ModelCtor<AppUserValidationCodeModel>;
    ubiBeneficiarySurvey: ModelCtor<UbiBeneficiarySurveyModel>;
    //
    community: ModelCtor<Community>;
    ubiCommunitySuspect: ModelCtor<UbiCommunitySuspectModel>;
    ubiCommunityContract: ModelCtor<UbiCommunityContractModel>;
    ubiCommunityDailyMetrics: ModelCtor<UbiCommunityDailyMetricsModel>;
    ubiCommunityDemographics: ModelCtor<UbiCommunityDemographicsModel>;
    ubiPromoter: ModelCtor<UbiPromoterModel>;
    ubiPromoterSocialMedia: ModelCtor<UbiPromoterSocialMediaModel>;
    ubiCommunityLabels: ModelCtor<UbiCommunityLabelModel>;
    ubiCommunityCampaign: ModelCtor<UbiCommunityCampaignModel>;
    ubiClaimLocation: ModelCtor<ClaimLocationModel>;
    beneficiary: ModelCtor<Beneficiary>;
    manager: ModelCtor<Manager>;
    //
    globalDailyState: ModelCtor<GlobalDailyState>;
    globalDemographics: ModelCtor<GlobalDemographics>;
    globalGrowth: ModelCtor<GlobalGrowthModel>;
    //
    storyContent: ModelCtor<StoryContentModel>;
    storyCommunity: ModelCtor<StoryCommunityModel>;
    storyEngagement: ModelCtor<StoryEngagementModel>;
    storyUserEngagement: ModelCtor<StoryUserEngagementModel>;
    storyUserReport: ModelCtor<StoryUserReportModel>;
    storyComment: ModelCtor<StoryCommentModel>;
    //
    airgrabUser: ModelCtor<AirgrabUserModel>;
    airgrabProof: ModelCtor<AirgrabProofModel>;
    //
    walletAirdropUser: ModelCtor<WalletAirdropUserModel>;
    walletAirdropProof: ModelCtor<WalletAirdropProofModel>;
    //
    learnAndEarnCategory: ModelCtor<LearnAndEarnCategoryModel>;
    learnAndEarnLesson: ModelCtor<LearnAndEarnLessonModel>;
    learnAndEarnLevel: ModelCtor<LearnAndEarnLevelModel>;
    learnAndEarnPrismicLevel: ModelCtor<LearnAndEarnPrismicLevelModel>;
    learnAndEarnPrismicLesson: ModelCtor<LearnAndEarnPrismicLessonModel>;
    learnAndEarnQuiz: ModelCtor<LearnAndEarnQuizModel>;
    learnAndEarnUserCategory: ModelCtor<LearnAndEarnUserCategoryModel>;
    learnAndEarnUserLesson: ModelCtor<LearnAndEarnUserLessonModel>;
    learnAndEarnUserLevel: ModelCtor<LearnAndEarnUserLevelModel>;
    learnAndEarnPayment: ModelCtor<LearnAndEarnPaymentModel>;
    //
    merchantRegistry: ModelCtor<MerchantRegistryModel>;
    merchantCommunity: ModelCtor<MerchantCommunityModel>;
    //
    exchangeRegistry: ModelCtor<ExchangeRegistryModel>;
}
export interface DbLoader {
    sequelize: Sequelize;
    models: DbModels;
}
