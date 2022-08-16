import apicache from 'apicache';
import pg from 'pg';
import redis from 'redis';
import { Sequelize, Options, ModelCtor } from 'sequelize';

import config from '../config';
import { Logger } from '../utils/logger';
import { DbModels } from './db';
import initModels from './models';
import * as AirgrabProof from './models/airgrab/airgrabProof';
import * as AirgrabUser from './models/airgrab/airgrabUser';
import * as AppAnonymousReport from './models/app/anonymousReport';
import * as AppClientCredential from './models/app/appClientCredential';
import * as AppLog from './models/app/appLog';
import * as AppMediaContent from './models/app/appMediaContent';
import * as AppMediaThumbnail from './models/app/appMediaThumbnail';
import * as AppNotification from './models/app/appNotification';
import * as AppProposal from './models/app/appProposal';
import * as AppUser from './models/app/appUser';
import * as AppUserThroughTrust from './models/app/appUserThroughTrust';
import * as AppUserTrust from './models/app/appUserTrust';
import { CronJobExecuted } from './models/app/cronJobExecuted';
import * as ExchangeRates from './models/app/exchangeRates';
import { ImMetadata } from './models/app/imMetadata';
import * as GlobalDailyState from './models/global/globalDailyState';
import * as GlobalDemographics from './models/global/globalDemographics';
import * as GlobalGrowth from './models/global/globalGrowth';
import * as MerchantCommunity from './models/merchant/merchantCommunity';
import * as MerchantRegistry from './models/merchant/merchantRegistry';
import * as ReachedAddress from './models/reachedAddress';
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
import * as UbiCommunityDailyState from './models/ubi/communityDailyState';
import * as UbiCommunityDemographics from './models/ubi/communityDemographics';
import * as Inflow from './models/ubi/inflow';
import * as Manager from './models/ubi/manager';
import * as UbiRequestChangeParams from './models/ubi/requestChangeParams';
import * as UbiBeneficiaryRegistry from './models/ubi/ubiBeneficiaryRegistry';
import * as UbiBeneficiarySurvey from './models/ubi/ubiBeneficiarySurvey';
import * as UbiBeneficiaryTransaction from './models/ubi/ubiBeneficiaryTransaction';
import * as UbiClaim from './models/ubi/ubiClaim';
import * as ClaimLocation from './models/ubi/ubiClaimLocation';
import * as UbiCommunityCampaign from './models/ubi/ubiCommunityCampaign';
import * as UbiCommunityLabel from './models/ubi/ubiCommunityLabel';
import * as UbiCommunitySuspect from './models/ubi/ubiCommunitySuspect';
import * as UbiPromoter from './models/ubi/ubiPromoter';
import * as UbiPromoterSocialMedia from './models/ubi/ubiPromoterSocialMedia';

let logging:
    | boolean
    | ((sql: string, timing?: number | undefined) => void)
    | undefined;
if (process.env.NODE_ENV === 'development') {
    logging = (msg) => console.log(msg);
} else {
    logging = (msg) => Logger.verbose(msg);
}
const dbConfig: Options = {
    dialect: 'postgres',
    dialectOptions: {
        connectTimeout: 60000,
        ssl: config.aws.lambda
            ? {
                  require: true,
                  rejectUnauthorized: false,
              }
            : {},
    },
    dialectModule: pg,
    pool: {
        max: 30,
        min: 0,
        acquire: 60000,
        idle: 5000,
    },
    protocol: 'postgres',
    native: !config.aws.lambda, // if lambda = true, then native = false
    logging,
    // query: { raw: true }, // I wish, eager loading gets fixed
};
const sequelize = new Sequelize(config.dbUrl, dbConfig);
initModels(sequelize);
const models: DbModels = {
    appUser: sequelize.models.AppUserModel as ModelCtor<AppUser.AppUserModel>,
    appUserTrust: sequelize.models
        .AppUserTrustModel as ModelCtor<AppUserTrust.AppUserTrustModel>,
    appProposal: sequelize.models
        .AppProposalModel as ModelCtor<AppProposal.AppProposalModel>,
    appUserThroughTrust: sequelize.models
        .AppUserThroughTrustModel as ModelCtor<AppUserThroughTrust.AppUserThroughTrustModel>,
    appClientCredential: sequelize.models
        .AppClientCredentialModel as ModelCtor<AppClientCredential.AppClientCredentialModel>,
    appLog: sequelize.models.AppLogModel as ModelCtor<AppLog.AppLogModel>,
    community: sequelize.models.Community as ModelCtor<Community>,
    ubiCommunitySuspect: sequelize.models
        .UbiCommunitySuspectModel as ModelCtor<UbiCommunitySuspect.UbiCommunitySuspectModel>,
    ubiCommunityContract: sequelize.models
        .UbiCommunityContractModel as ModelCtor<UbiCommunityContract.UbiCommunityContractModel>,
    ubiCommunityDailyState: sequelize.models
        .UbiCommunityDailyStateModel as ModelCtor<UbiCommunityDailyState.UbiCommunityDailyStateModel>,
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
    ubiRequestChangeParams: sequelize.models
        .UbiRequestChangeParamsModel as ModelCtor<UbiRequestChangeParams.UbiRequestChangeParamsModel>,
    ubiClaim: sequelize.models
        .UbiClaimModel as ModelCtor<UbiClaim.UbiClaimModel>,
    ubiClaimLocation: sequelize.models
        .ClaimLocationModel as ModelCtor<ClaimLocation.ClaimLocationModel>,
    beneficiary: sequelize.models.Beneficiary as ModelCtor<Beneficiary>,
    ubiBeneficiaryRegistry: sequelize.models
        .UbiBeneficiaryRegistryModel as ModelCtor<UbiBeneficiaryRegistry.UbiBeneficiaryRegistryModel>,
    ubiBeneficiarySurvey: sequelize.models
        .UbiBeneficiarySurveyModel as ModelCtor<UbiBeneficiarySurvey.UbiBeneficiarySurveyModel>,
    anonymousReport: sequelize.models
        .AppAnonymousReportModel as ModelCtor<AppAnonymousReport.AppAnonymousReportModel>,
    ubiBeneficiaryTransaction: sequelize.models
        .UbiBeneficiaryTransactionModel as ModelCtor<UbiBeneficiaryTransaction.UbiBeneficiaryTransactionModel>,
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
    inflow: sequelize.models.Inflow as ModelCtor<Inflow.Inflow>,
    manager: sequelize.models.Manager as ModelCtor<Manager.Manager>,
    reachedAddress: sequelize.models
        .ReachedAddress as ModelCtor<ReachedAddress.ReachedAddress>,

    appMediaContent: sequelize.models
        .AppMediaContentModel as ModelCtor<AppMediaContent.AppMediaContentModel>,
    appMediaThumbnail: sequelize.models
        .AppMediaThumbnailModel as ModelCtor<AppMediaThumbnail.AppMediaThumbnailModel>,
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
    merchantRegistry: sequelize.models
        .MerchantRegistryModel as ModelCtor<MerchantRegistry.MerchantRegistryModel>,
    merchantCommunity: sequelize.models
        .MerchantCommunityModel as ModelCtor<MerchantCommunity.MerchantCommunityModel>,
};

let redisClient: redis.RedisClient | undefined;
if (process.env.NODE_ENV !== 'test') {
    redisClient = redis.createClient(config.redis, {
        ...(config.hasRedisTls
            ? {
                  tls: {
                      rejectUnauthorized: false,
                  },
              }
            : {}),
    });
}
const cacheOnlySuccess = (req, res) => res.statusCode === 200;
const apiCacheOptions = {
    debug: !config.enabledCacheWithRedis,
    enabled: config.enabledCacheWithRedis,
    redisClient,
};
const cacheWithRedis = apicache.options(apiCacheOptions).middleware;
export {
    AirgrabProof,
    AirgrabUser,
    AppAnonymousReport,
    AppMediaContent,
    AppMediaThumbnail,
    AppNotification,
    AppProposal,
    AppUser,
    AppUserThroughTrust,
    AppUserTrust,
    CronJobExecuted,
    ExchangeRates,
    ImMetadata,
    GlobalDailyState,
    GlobalDemographics,
    GlobalGrowth,
    ReachedAddress,
    StoryCommunity,
    StoryContent,
    StoryEngagement,
    StoryUserEngagement,
    StoryUserReport,
    Beneficiary,
    Community,
    UbiCommunityContract,
    UbiCommunityDailyMetrics,
    UbiCommunityDailyState,
    UbiCommunityDemographics,
    Inflow,
    Manager,
    UbiRequestChangeParams,
    UbiBeneficiaryRegistry,
    UbiBeneficiarySurvey,
    UbiBeneficiaryTransaction,
    UbiClaim,
    ClaimLocation,
    UbiCommunityCampaign,
    UbiCommunityLabel,
    UbiCommunitySuspect,
    UbiPromoter,
    UbiPromoterSocialMedia,
};
export {
    sequelize,
    Sequelize,
    models,
    redisClient,
    cacheWithRedis,
    cacheOnlySuccess,
};
