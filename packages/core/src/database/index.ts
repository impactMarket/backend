import Redis from 'ioredis';
import pg from 'pg';
import { Sequelize, Options, ModelCtor } from 'sequelize';

import { DbModels } from './db';
import initModels from './models';
import * as AirgrabProof from './models/airgrab/airgrabProof';
import * as AirgrabUser from './models/airgrab/airgrabUser';
import * as AppAnonymousReport from './models/app/anonymousReport';
import * as AppClientCredential from './models/app/appClientCredential';
import * as AppLog from './models/app/appLog';
import * as AppNotification from './models/app/appNotification';
import * as AppProposal from './models/app/appProposal';
import * as AppUser from './models/app/appUser';
import { AppUserValidationCodeModel } from './models/app/appUserValidationCode';
import { CronJobExecuted } from './models/app/cronJobExecuted';
import * as ExchangeRates from './models/app/exchangeRates';
import { ImMetadata } from './models/app/imMetadata';
import * as ExchangeRegistry from './models/exchange/exchangeRegistry';
import * as GlobalDailyState from './models/global/globalDailyState';
import * as GlobalDemographics from './models/global/globalDemographics';
import * as GlobalGrowth from './models/global/globalGrowth';
import * as LearnAndEarnCategory from './models/learnAndEarn/learnAndEarnCategory';
import * as LearnAndEarnLesson from './models/learnAndEarn/learnAndEarnLesson';
import * as LearnAndEarnLevel from './models/learnAndEarn/learnAndEarnLevel';
import * as LearnAndEarnPayment from './models/learnAndEarn/learnAndEarnPayment';
import * as LearnAndEarnQuiz from './models/learnAndEarn/learnAndEarnQuiz';
import * as LearnAndEarnUserCategory from './models/learnAndEarn/learnAndEarnUserCategory';
import * as LearnAndEarnUserLesson from './models/learnAndEarn/learnAndEarnUserLesson';
import * as LearnAndEarnUserLevel from './models/learnAndEarn/learnAndEarnUserLevel';
import * as MerchantCommunity from './models/merchant/merchantCommunity';
import * as MerchantRegistry from './models/merchant/merchantRegistry';
import * as StoryComment from './models/story/storyComment';
import * as StoryCommunity from './models/story/storyCommunity';
import * as StoryContent from './models/story/storyContent';
import * as StoryEngagement from './models/story/storyEngagement';
import * as StoryUserEngagement from './models/story/storyUserEngagement';
import * as StoryUserReport from './models/story/storyUserReport';
import { Beneficiary } from './models/ubi/beneficiary';
import { Community } from './models/ubi/community';
import * as UbiCommunityContract from './models/ubi/communityContract';
import * as UbiCommunityDailyMetrics from './models/ubi/communityDailyMetrics';
import * as UbiCommunityDemographics from './models/ubi/communityDemographics';
import * as Manager from './models/ubi/manager';
import * as UbiBeneficiarySurvey from './models/ubi/ubiBeneficiarySurvey';
import * as ClaimLocation from './models/ubi/ubiClaimLocation';
import * as UbiCommunityCampaign from './models/ubi/ubiCommunityCampaign';
import * as UbiCommunityLabel from './models/ubi/ubiCommunityLabel';
import * as UbiCommunitySuspect from './models/ubi/ubiCommunitySuspect';
import * as UbiPromoter from './models/ubi/ubiPromoter';
import * as UbiPromoterSocialMedia from './models/ubi/ubiPromoterSocialMedia';
import * as WalletAirdropProof from './models/walletAirdrop/walletAirdropProof';
import * as WalletAirdropUser from './models/walletAirdrop/walletAirdropUser';
import config from '../config';
import { Logger } from '../utils/logger';

let logging:
    | boolean
    | ((sql: string, timing?: number | undefined) => void)
    | undefined;
if (process.env.NODE_ENV === 'development') {
    logging = (msg, timing) =>
        console.log(
            `\n\x1b[46mQUERY:\x1b[0m ${msg} \x1b[7mTIME:\x1b[0m\x1b[100m ${timing}ms\x1b[0m`
        );
} else {
    logging = (msg) => Logger.verbose(msg);
}
const dbConfig: Options = {
    dialect: 'postgres',
    dialectOptions: {
        connectTimeout: 60000,
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    dialectModule: pg,
    pool: {
        max: config.maxDatabasePoolConnections,
        min: 0,
        acquire: 60000,
        idle: 15000,
    },
    protocol: 'postgres',
    native: !config.aws.lambda, // if lambda = true, then native = false
    logging,
    benchmark: process.env.NODE_ENV === 'development',
};
const sequelize = new Sequelize(config.dbUrl, dbConfig);
initModels(sequelize);
const models: DbModels = {
    appUser: sequelize.models.AppUserModel as ModelCtor<AppUser.AppUserModel>,
    appProposal: sequelize.models
        .AppProposalModel as ModelCtor<AppProposal.AppProposalModel>,
    appClientCredential: sequelize.models
        .AppClientCredentialModel as ModelCtor<AppClientCredential.AppClientCredentialModel>,
    appLog: sequelize.models.AppLogModel as ModelCtor<AppLog.AppLogModel>,
    appUserValidationCode: sequelize.models
        .AppUserValidationCodeModel as ModelCtor<AppUserValidationCodeModel>,
    community: sequelize.models.Community as ModelCtor<Community>,
    ubiCommunitySuspect: sequelize.models
        .UbiCommunitySuspectModel as ModelCtor<UbiCommunitySuspect.UbiCommunitySuspectModel>,
    ubiCommunityContract: sequelize.models
        .UbiCommunityContractModel as ModelCtor<UbiCommunityContract.UbiCommunityContractModel>,
    ubiCommunityDailyMetrics: sequelize.models
        .UbiCommunityDailyMetricsModel as ModelCtor<UbiCommunityDailyMetrics.UbiCommunityDailyMetricsModel>,
    ubiCommunityDemographics: sequelize.models
        .UbiCommunityDemographicsModel as ModelCtor<UbiCommunityDemographics.UbiCommunityDemographicsModel>,
    ubiPromoter: sequelize.models
        .UbiPromoterModel as ModelCtor<UbiPromoter.UbiPromoterModel>,
    ubiPromoterSocialMedia: sequelize.models
        .UbiPromoterSocialMediaModel as ModelCtor<UbiPromoterSocialMedia.UbiPromoterSocialMediaModel>,
    ubiCommunityLabels: sequelize.models
        .UbiCommunityLabelModel as ModelCtor<UbiCommunityLabel.UbiCommunityLabelModel>,
    ubiCommunityCampaign: sequelize.models
        .UbiCommunityCampaignModel as ModelCtor<UbiCommunityCampaign.UbiCommunityCampaignModel>,
    ubiClaimLocation: sequelize.models
        .ClaimLocationModel as ModelCtor<ClaimLocation.ClaimLocationModel>,
    beneficiary: sequelize.models.Beneficiary as ModelCtor<Beneficiary>,
    ubiBeneficiarySurvey: sequelize.models
        .UbiBeneficiarySurveyModel as ModelCtor<UbiBeneficiarySurvey.UbiBeneficiarySurveyModel>,
    anonymousReport: sequelize.models
        .AppAnonymousReportModel as ModelCtor<AppAnonymousReport.AppAnonymousReportModel>,
    cronJobExecuted: sequelize.models
        .CronJobExecuted as ModelCtor<CronJobExecuted>,
    exchangeRates: sequelize.models
        .ExchangeRates as ModelCtor<ExchangeRates.ExchangeRates>,
    globalDailyState: sequelize.models
        .GlobalDailyState as ModelCtor<GlobalDailyState.GlobalDailyState>,
    globalDemographics: sequelize.models
        .GlobalDemographics as ModelCtor<GlobalDemographics.GlobalDemographics>,
    globalGrowth: sequelize.models
        .GlobalGrowthModel as ModelCtor<GlobalGrowth.GlobalGrowthModel>,
    // userDevice: sequelize.models
    imMetadata: sequelize.models.ImMetadata as ModelCtor<ImMetadata>,
    manager: sequelize.models.Manager as ModelCtor<Manager.Manager>,

    appNotification: sequelize.models
        .AppNotificationModel as ModelCtor<AppNotification.AppNotificationModel>,
    // stories
    storyContent: sequelize.models
        .StoryContentModel as ModelCtor<StoryContent.StoryContentModel>,
    storyCommunity: sequelize.models
        .StoryCommunityModel as ModelCtor<StoryCommunity.StoryCommunityModel>,
    storyEngagement: sequelize.models
        .StoryEngagementModel as ModelCtor<StoryEngagement.StoryEngagementModel>,
    storyUserEngagement: sequelize.models
        .StoryUserEngagementModel as ModelCtor<StoryUserEngagement.StoryUserEngagementModel>,
    storyUserReport: sequelize.models
        .StoryUserReportModel as ModelCtor<StoryUserReport.StoryUserReportModel>,
    storyComment: sequelize.models
        .StoryCommentModel as ModelCtor<StoryComment.StoryCommentModel>,
    airgrabUser: sequelize.models
        .AirgrabUserModel as ModelCtor<AirgrabUser.AirgrabUserModel>,
    airgrabProof: sequelize.models
        .AirgrabProofModel as ModelCtor<AirgrabProof.AirgrabProofModel>,
    // Wallet Airdrop
    walletAirdropUser: sequelize.models
        .WalletAirdropUserModel as ModelCtor<WalletAirdropUser.WalletAirdropUserModel>,
    walletAirdropProof: sequelize.models
        .WalletAirdropProofModel as ModelCtor<WalletAirdropProof.WalletAirdropProofModel>,
    // L&E
    learnAndEarnCategory: sequelize.models
        .LearnAndEarnCategoryModel as ModelCtor<LearnAndEarnCategory.LearnAndEarnCategoryModel>,
    learnAndEarnLesson: sequelize.models
        .LearnAndEarnLessonModel as ModelCtor<LearnAndEarnLesson.LearnAndEarnLessonModel>,
    learnAndEarnLevel: sequelize.models
        .LearnAndEarnLevelModel as ModelCtor<LearnAndEarnLevel.LearnAndEarnLevelModel>,
    learnAndEarnQuiz: sequelize.models
        .LearnAndEarnQuizModel as ModelCtor<LearnAndEarnQuiz.LearnAndEarnQuizModel>,
    learnAndEarnUserCategory: sequelize.models
        .LearnAndEarnUserCategoryModel as ModelCtor<LearnAndEarnUserCategory.LearnAndEarnUserCategoryModel>,
    learnAndEarnUserLesson: sequelize.models
        .LearnAndEarnUserLessonModel as ModelCtor<LearnAndEarnUserLesson.LearnAndEarnUserLessonModel>,
    learnAndEarnUserLevel: sequelize.models
        .LearnAndEarnUserLevelModel as ModelCtor<LearnAndEarnUserLevel.LearnAndEarnUserLevelModel>,
    learnAndEarnPayment: sequelize.models
        .LearnAndEarnPaymentModel as ModelCtor<LearnAndEarnPayment.LearnAndEarnPaymentModel>,
    merchantRegistry: sequelize.models
        .MerchantRegistryModel as ModelCtor<MerchantRegistry.MerchantRegistryModel>,
    merchantCommunity: sequelize.models
        .MerchantCommunityModel as ModelCtor<MerchantCommunity.MerchantCommunityModel>,
    exchangeRegistry: sequelize.models
        .ExchangeRegistryModel as ModelCtor<ExchangeRegistry.ExchangeRegistryModel>,
};

let redisClient: Redis = undefined as any;

if (process.env.NODE_ENV !== 'test') {
    redisClient = new Redis(config.redis);
}

export {
    AirgrabProof,
    AirgrabUser,
    AppAnonymousReport,
    AppNotification,
    AppProposal,
    AppUser,
    CronJobExecuted,
    ExchangeRates,
    ImMetadata,
    GlobalDailyState,
    GlobalDemographics,
    GlobalGrowth,
    StoryCommunity,
    StoryContent,
    StoryEngagement,
    StoryUserEngagement,
    StoryUserReport,
    Beneficiary,
    Community,
    UbiCommunityContract,
    UbiCommunityDailyMetrics,
    UbiCommunityDemographics,
    Manager,
    UbiBeneficiarySurvey,
    ClaimLocation,
    UbiCommunityCampaign,
    UbiCommunityLabel,
    UbiCommunitySuspect,
    UbiPromoter,
    UbiPromoterSocialMedia,
};
export { sequelize, Sequelize, models, redisClient };
