import { AppAnonymousReportModel } from '@models/app/anonymousReport';
import { AppUserThroughTrustModel } from '@models/app/appUserThroughTrust';
import { AppUserTrustModel } from '@models/app/appUserTrust';
import { CronJobExecuted } from '@models/app/cronJobExecuted';
import { ExchangeRates } from '@models/app/exchangeRates';
import { ImMetadata } from '@models/app/imMetadata';
import { MobileError } from '@models/app/mobileError';
import { SubscribersModel } from '@models/app/subscribers';
import { UserModel } from '@models/app/user';
import { AppUserDeviceModel } from '@models/app/userDevice';
import { GlobalDailyState } from '@models/global/globalDailyState';
import { GlobalDemographics } from '@models/global/globalDemographics';
import { GlobalGrowthModel } from '@models/global/globalGrowth';
import { NotifiedBacker } from '@models/notifiedBacker';
import { ReachedAddress } from '@models/reachedAddress';
import { StoryCommunityModel } from '@models/story/storyCommunity';
import { StoryContentModel } from '@models/story/storyContent';
import { StoryEngagementModel } from '@models/story/storyEngagement';
import { StoryUserEngagementModel } from '@models/story/storyUserEngagement';
import { StoryUserReportModel } from '@models/story/storyUserReport';
import { Beneficiary } from '@models/ubi/beneficiary';
import { BeneficiaryTransaction } from '@models/ubi/beneficiaryTransaction';
import { Claim } from '@models/ubi/claim';
import { ClaimLocation } from '@models/ubi/claimLocation';
import { Community } from '@models/ubi/community';
import { UbiCommunityContractModel } from '@models/ubi/communityContract';
import { UbiCommunityDailyMetricsModel } from '@models/ubi/communityDailyMetrics';
import { UbiCommunityDailyStateModel } from '@models/ubi/communityDailyState';
import { UbiCommunityStateModel } from '@models/ubi/communityState';
import { Inflow } from '@models/ubi/inflow';
import { Manager } from '@models/ubi/manager';
import { UbiRequestChangeParamsModel } from '@models/ubi/requestChangeParams';
import { UbiCommunitySuspectModel } from '@models/ubi/ubiCommunitySuspect';
import { ModelCtor, Sequelize } from 'sequelize/types';

export interface DbModels {
    user: ModelCtor<UserModel>;
    appUserTrust: ModelCtor<AppUserTrustModel>;
    appUserThroughTrust: ModelCtor<AppUserThroughTrustModel>;
    community: ModelCtor<Community>;
    ubiCommunitySuspect: ModelCtor<UbiCommunitySuspectModel>;
    ubiCommunityContract: ModelCtor<UbiCommunityContractModel>;
    ubiCommunityState: ModelCtor<UbiCommunityStateModel>;
    ubiCommunityDailyState: ModelCtor<UbiCommunityDailyStateModel>;
    ubiCommunityDailyMetrics: ModelCtor<UbiCommunityDailyMetricsModel>;
    ubiRequestChangeParams: ModelCtor<UbiRequestChangeParamsModel>;
    claim: ModelCtor<Claim>;
    claimLocation: ModelCtor<ClaimLocation>;
    beneficiary: ModelCtor<Beneficiary>;
    anonymousReport: ModelCtor<AppAnonymousReportModel>;
    beneficiaryTransaction: ModelCtor<BeneficiaryTransaction>;
    cronJobExecuted: ModelCtor<CronJobExecuted>;
    exchangeRates: ModelCtor<ExchangeRates>;
    globalDailyState: ModelCtor<GlobalDailyState>;
    globalDemographics: ModelCtor<GlobalDemographics>;
    globalGrowth: ModelCtor<GlobalGrowthModel>;
    userDevice: ModelCtor<AppUserDeviceModel>;
    imMetadata: ModelCtor<ImMetadata>;
    inflow: ModelCtor<Inflow>;
    manager: ModelCtor<Manager>;
    mobileError: ModelCtor<MobileError>;
    subscribers: ModelCtor<SubscribersModel>;
    notifiedBacker: ModelCtor<NotifiedBacker>;
    reachedAddress: ModelCtor<ReachedAddress>;
    //
    storyContent: ModelCtor<StoryContentModel>;
    storyCommunity: ModelCtor<StoryCommunityModel>;
    storyEngagement: ModelCtor<StoryEngagementModel>;
    storyUserEngagement: ModelCtor<StoryUserEngagementModel>;
    storyUserReport: ModelCtor<StoryUserReportModel>;
}
export interface DbLoader {
    sequelize: Sequelize;
    models: DbModels;
}
