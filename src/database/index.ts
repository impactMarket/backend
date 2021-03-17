import { SubscribersModel } from '@models/app/subscribers';
import { Beneficiary } from '@models/beneficiary';
import { BeneficiaryTransaction } from '@models/beneficiaryTransaction';
import { Claim } from '@models/claim';
import { ClaimLocation } from '@models/claimLocation';
import { Community } from '@models/community';
import { CommunityContract } from '@models/communityContract';
import { CommunityDailyMetrics } from '@models/communityDailyMetrics';
import { CommunityDailyState } from '@models/communityDailyState';
import { CommunityState } from '@models/communityState';
import { CronJobExecuted } from '@models/cronJobExecuted';
import { ExchangeRates } from '@models/exchangeRates';
import { GlobalGrowthModel } from '@models/globalGrowth';
import { GlobalDailyState } from '@models/globalDailyState';
import { GlobalDemographics } from '@models/globalDemographics';
import { ImMetadata } from '@models/imMetadata';
import { Inflow } from '@models/inflow';
import { Manager } from '@models/manager';
import { MobileError } from '@models/mobileError';
import { NotifiedBacker } from '@models/notifiedBacker';
import { ReachedAddress } from '@models/reachedAddress';
import { UserModel } from '@models/user';
import { Logger } from '@utils/logger';
import { Sequelize, Options, ModelCtor } from 'sequelize';

import config from '../config';
import { DbModels } from '../types/db';
import initModels from './models';
import { StoryCommunityModel } from '@models/story/storyCommunity';
import { StoryContentModel } from '@models/story/storyContent';
import { StoryEngagementModel } from '@models/story/storyEngagement';
import { StoryUserEngagementModel } from '@models/story/storyUserEngagement';
import { AppUserDeviceModel } from '@models/app/userDevice';
import { AppAnonymousReportModel } from '@models/app/anonymousReport';
import { UbiRequestChangeParamsModel } from '@models/UBI/requestChangeParams';
import { StoryUserReportModel } from '@models/story/storyUserReport';
import { AppUserThroughTrustModel } from '@models/app/appUserThroughTrust';
import { AppUserTrustModel } from '@models/app/appUserTrust';

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
    protocol: 'postgres',
    native: true,
    logging,
    // query: { raw: true }, // I wish, eager loading gets fixed
};
const sequelize = new Sequelize(config.dbUrl, dbConfig);
initModels(sequelize);
const models: DbModels = {
    user: sequelize.models.UserModel as ModelCtor<UserModel>,
    appUserTrust: sequelize.models
        .AppUserTrustModel as ModelCtor<AppUserTrustModel>,
    appUserThroughTrust: sequelize.models
        .AppUserThroughTrustModel as ModelCtor<AppUserThroughTrustModel>,
    community: sequelize.models.Community as ModelCtor<Community>,
    communityContract: sequelize.models
        .CommunityContract as ModelCtor<CommunityContract>,
    communityState: sequelize.models
        .CommunityState as ModelCtor<CommunityState>,
    communityDailyState: sequelize.models
        .CommunityDailyState as ModelCtor<CommunityDailyState>,
    communityDailyMetrics: sequelize.models
        .CommunityDailyMetrics as ModelCtor<CommunityDailyMetrics>,
    ubiRequestChangeParams: sequelize.models
        .UbiRequestChangeParamsModel as ModelCtor<UbiRequestChangeParamsModel>,
    claim: sequelize.models.Claim as ModelCtor<Claim>,
    claimLocation: sequelize.models.ClaimLocation as ModelCtor<ClaimLocation>,
    beneficiary: sequelize.models.Beneficiary as ModelCtor<Beneficiary>,
    anonymousReport: sequelize.models
        .AppAnonymousReportModel as ModelCtor<AppAnonymousReportModel>,
    beneficiaryTransaction: sequelize.models
        .BeneficiaryTransaction as ModelCtor<BeneficiaryTransaction>,
    cronJobExecuted: sequelize.models
        .CronJobExecuted as ModelCtor<CronJobExecuted>,
    exchangeRates: sequelize.models.ExchangeRates as ModelCtor<ExchangeRates>,
    globalDailyState: sequelize.models
        .GlobalDailyState as ModelCtor<GlobalDailyState>,
    globalDemographics: sequelize.models
        .GlobalDemographics as ModelCtor<GlobalDemographics>,
    globalGrowth: sequelize.models
        .GlobalGrowthModel as ModelCtor<GlobalGrowthModel>,
    userDevice: sequelize.models
        .AppUserDeviceModel as ModelCtor<AppUserDeviceModel>,
    imMetadata: sequelize.models.ImMetadata as ModelCtor<ImMetadata>,
    inflow: sequelize.models.Inflow as ModelCtor<Inflow>,
    manager: sequelize.models.Manager as ModelCtor<Manager>,
    mobileError: sequelize.models.MobileError as ModelCtor<MobileError>,
    subscribers: sequelize.models
        .SubscribersModel as ModelCtor<SubscribersModel>,
    notifiedBacker: sequelize.models
        .NotifiedBacker as ModelCtor<NotifiedBacker>,
    reachedAddress: sequelize.models
        .ReachedAddress as ModelCtor<ReachedAddress>,
    // stories
    storyContent: sequelize.models
        .StoryContentModel as ModelCtor<StoryContentModel>,
    storyCommunity: sequelize.models
        .StoryCommunityModel as ModelCtor<StoryCommunityModel>,
    storyEngagement: sequelize.models
        .StoryEngagementModel as ModelCtor<StoryEngagementModel>,
    storyUserEngagement: sequelize.models
        .StoryUserEngagementModel as ModelCtor<StoryUserEngagementModel>,
    storyUserReport: sequelize.models
        .StoryUserReportModel as ModelCtor<StoryUserReportModel>,
};

export { sequelize, Sequelize, models };
