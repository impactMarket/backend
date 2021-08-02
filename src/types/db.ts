import { AppAnonymousReportModel } from '@models/app/anonymousReport';
import { AppMediaContentModel } from '@models/app/appMediaContent';
import { AppMediaThumbnailModel } from '@models/app/appMediaThumbnail';
import { AppUserThroughTrustModel } from '@models/app/appUserThroughTrust';
import { AppUserTrustModel } from '@models/app/appUserTrust';
import { CronJobExecuted } from '@models/app/cronJobExecuted';
import { ExchangeRates } from '@models/app/exchangeRates';
import { ImMetadata } from '@models/app/imMetadata';
import { SubscribersModel } from '@models/app/subscribers';
import { UserModel } from '@models/app/user';
// import { AppUserDeviceModel } from '@models/app/userDevice';
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
import { Community } from '@models/ubi/community';
import { UbiCommunityContractModel } from '@models/ubi/communityContract';
import { UbiCommunityDailyMetricsModel } from '@models/ubi/communityDailyMetrics';
import { UbiCommunityDailyStateModel } from '@models/ubi/communityDailyState';
import { UbiCommunityDemographicsModel } from '@models/ubi/communityDemographics';
import { UbiCommunityStateModel } from '@models/ubi/communityState';
import { Inflow } from '@models/ubi/inflow';
import { Manager } from '@models/ubi/manager';
import { UbiRequestChangeParamsModel } from '@models/ubi/requestChangeParams';
import { UbiClaimModel } from '@models/ubi/ubiClaim';
import { ClaimLocationModel } from '@models/ubi/ubiClaimLocation';
import { UbiCommunityCampaignModel } from '@models/ubi/ubiCommunityCampaign';
import { UbiCommunityLabelModel } from '@models/ubi/ubiCommunityLabel';
import { UbiCommunitySuspectModel } from '@models/ubi/ubiCommunitySuspect';
import { UbiPromoterModel } from '@models/ubi/ubiPromoter';
import { UbiPromoterSocialMediaModel } from '@models/ubi/ubiPromoterSocialMedia';
import { ModelCtor, Sequelize } from 'sequelize/types';

export interface DbModels {
    user: ModelCtor<UserModel>;
    appUserTrust: ModelCtor<AppUserTrustModel>;
    appUserThroughTrust: ModelCtor<AppUserThroughTrustModel>;
    anonymousReport: ModelCtor<AppAnonymousReportModel>;
    cronJobExecuted: ModelCtor<CronJobExecuted>;
    exchangeRates: ModelCtor<ExchangeRates>;
    // userDevice: ModelCtor<AppUserDeviceModel>;
    imMetadata: ModelCtor<ImMetadata>;
    subscribers: ModelCtor<SubscribersModel>;
    reachedAddress: ModelCtor<ReachedAddress>;
    notifiedBacker: ModelCtor<NotifiedBacker>;
    appMediaContent: ModelCtor<AppMediaContentModel>;
    appMediaThumbnail: ModelCtor<AppMediaThumbnailModel>;
    //
    community: ModelCtor<Community>;
    ubiCommunitySuspect: ModelCtor<UbiCommunitySuspectModel>;
    ubiCommunityContract: ModelCtor<UbiCommunityContractModel>;
    ubiCommunityState: ModelCtor<UbiCommunityStateModel>;
    ubiCommunityDailyState: ModelCtor<UbiCommunityDailyStateModel>;
    ubiCommunityDailyMetrics: ModelCtor<UbiCommunityDailyMetricsModel>;
    ubiCommunityDemographics: ModelCtor<UbiCommunityDemographicsModel>;
    ubiPromoter: ModelCtor<UbiPromoterModel>;
    ubiPromoterSocialMedia: ModelCtor<UbiPromoterSocialMediaModel>;
    ubiCommunityLabels: ModelCtor<UbiCommunityLabelModel>;
    ubiCommunityCampaign: ModelCtor<UbiCommunityCampaignModel>;
    ubiRequestChangeParams: ModelCtor<UbiRequestChangeParamsModel>;
    ubiClaim: ModelCtor<UbiClaimModel>;
    ubiClaimLocation: ModelCtor<ClaimLocationModel>;
    beneficiary: ModelCtor<Beneficiary>;
    beneficiaryTransaction: ModelCtor<BeneficiaryTransaction>;
    inflow: ModelCtor<Inflow>;
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
}
export interface DbLoader {
    sequelize: Sequelize;
    models: DbModels;
}
