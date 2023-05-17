import { ModelStatic, Sequelize } from 'sequelize/types';

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

export type DbModels = {
    appUser: ModelStatic<AppUserModel>;
    appProposal: ModelStatic<AppProposalModel>;
    appLog: ModelStatic<AppLogModel>;
    appClientCredential: ModelStatic<AppClientCredentialModel>;
    anonymousReport: ModelStatic<AppAnonymousReportModel>;
    cronJobExecuted: ModelStatic<CronJobExecuted>;
    exchangeRates: ModelStatic<ExchangeRates>;
    imMetadata: ModelStatic<ImMetadata>;
    appNotification: ModelStatic<AppNotificationModel>;
    appUserValidationCode: ModelStatic<AppUserValidationCodeModel>;
    ubiBeneficiarySurvey: ModelStatic<UbiBeneficiarySurveyModel>;
    //
    community: ModelStatic<Community>;
    ubiCommunitySuspect: ModelStatic<UbiCommunitySuspectModel>;
    ubiCommunityContract: ModelStatic<UbiCommunityContractModel>;
    ubiCommunityDailyMetrics: ModelStatic<UbiCommunityDailyMetricsModel>;
    ubiCommunityDemographics: ModelStatic<UbiCommunityDemographicsModel>;
    ubiPromoter: ModelStatic<UbiPromoterModel>;
    ubiPromoterSocialMedia: ModelStatic<UbiPromoterSocialMediaModel>;
    ubiCommunityLabels: ModelStatic<UbiCommunityLabelModel>;
    ubiCommunityCampaign: ModelStatic<UbiCommunityCampaignModel>;
    ubiClaimLocation: ModelStatic<ClaimLocationModel>;
    beneficiary: ModelStatic<Beneficiary>;
    manager: ModelStatic<Manager>;
    //
    globalDailyState: ModelStatic<GlobalDailyState>;
    globalDemographics: ModelStatic<GlobalDemographics>;
    globalGrowth: ModelStatic<GlobalGrowthModel>;
    //
    storyContent: ModelStatic<StoryContentModel>;
    storyCommunity: ModelStatic<StoryCommunityModel>;
    storyEngagement: ModelStatic<StoryEngagementModel>;
    storyUserEngagement: ModelStatic<StoryUserEngagementModel>;
    storyUserReport: ModelStatic<StoryUserReportModel>;
    storyComment: ModelStatic<StoryCommentModel>;
    //
    airgrabUser: ModelStatic<AirgrabUserModel>;
    airgrabProof: ModelStatic<AirgrabProofModel>;
    //
    walletAirdropUser: ModelStatic<WalletAirdropUserModel>;
    walletAirdropProof: ModelStatic<WalletAirdropProofModel>;
    //
    learnAndEarnCategory: ModelStatic<LearnAndEarnCategoryModel>;
    learnAndEarnLesson: ModelStatic<LearnAndEarnLessonModel>;
    learnAndEarnLevel: ModelStatic<LearnAndEarnLevelModel>;
    learnAndEarnPrismicLevel: ModelStatic<LearnAndEarnPrismicLevelModel>;
    learnAndEarnPrismicLesson: ModelStatic<LearnAndEarnPrismicLessonModel>;
    learnAndEarnQuiz: ModelStatic<LearnAndEarnQuizModel>;
    learnAndEarnUserCategory: ModelStatic<LearnAndEarnUserCategoryModel>;
    learnAndEarnUserLesson: ModelStatic<LearnAndEarnUserLessonModel>;
    learnAndEarnUserLevel: ModelStatic<LearnAndEarnUserLevelModel>;
    learnAndEarnPayment: ModelStatic<LearnAndEarnPaymentModel>;
    //
    merchantRegistry: ModelStatic<MerchantRegistryModel>;
    merchantCommunity: ModelStatic<MerchantCommunityModel>;
    //
    exchangeRegistry: ModelStatic<ExchangeRegistryModel>;
}
export interface DbLoader {
    sequelize: Sequelize;
    models: DbModels;
}
