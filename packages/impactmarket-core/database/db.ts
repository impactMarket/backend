import { AirgrabProofModel } from './models/airgrab/airgrabProof';
import { AirgrabUserModel } from './models/airgrab/airgrabUser';
import { AppAnonymousReportModel } from './models/app/anonymousReport';
import { AppMediaContentModel } from './models/app/appMediaContent';
import { AppMediaThumbnailModel } from './models/app/appMediaThumbnail';
import { AppNotificationModel } from './models/app/appNotification';
import { AppProposalModel } from './models/app/appProposal';
import { AppUserModel } from './models/app/appUser';
import { AppUserThroughTrustModel } from './models/app/appUserThroughTrust';
import { AppUserTrustModel } from './models/app/appUserTrust';
import { CronJobExecuted } from './models/app/cronJobExecuted';
import { ExchangeRates } from './models/app/exchangeRates';
import { ImMetadata } from './models/app/imMetadata';
import { GlobalDailyState } from './models/global/globalDailyState';
import { GlobalDemographics } from './models/global/globalDemographics';
import { GlobalGrowthModel } from './models/global/globalGrowth';
import { NotifiedBacker } from './models/notifiedBacker';
import { ReachedAddress } from './models/reachedAddress';
import { StoryCommunityModel } from './models/story/storyCommunity';
import { StoryContentModel } from './models/story/storyContent';
import { StoryEngagementModel } from './models/story/storyEngagement';
import { StoryUserEngagementModel } from './models/story/storyUserEngagement';
import { StoryUserReportModel } from './models/story/storyUserReport';
import { Beneficiary } from './models/ubi/beneficiary';
import { Community } from './models/ubi/community';
import { UbiCommunityContractModel } from './models/ubi/communityContract';
import { UbiCommunityDailyMetricsModel } from './models/ubi/communityDailyMetrics';
import { UbiCommunityDailyStateModel } from './models/ubi/communityDailyState';
import { UbiCommunityDemographicsModel } from './models/ubi/communityDemographics';
import { Inflow } from './models/ubi/inflow';
import { Manager } from './models/ubi/manager';
import { UbiRequestChangeParamsModel } from './models/ubi/requestChangeParams';
import { UbiBeneficiaryRegistryModel } from './models/ubi/ubiBeneficiaryRegistry';
import { UbiBeneficiarySurveyModel } from './models/ubi/ubiBeneficiarySurvey';
import { UbiBeneficiaryTransactionModel } from './models/ubi/ubiBeneficiaryTransaction';
import { UbiClaimModel } from './models/ubi/ubiClaim';
import { ClaimLocationModel } from './models/ubi/ubiClaimLocation';
import { UbiCommunityCampaignModel } from './models/ubi/ubiCommunityCampaign';
import { UbiCommunityLabelModel } from './models/ubi/ubiCommunityLabel';
import { UbiCommunitySuspectModel } from './models/ubi/ubiCommunitySuspect';
import { UbiPromoterModel } from './models/ubi/ubiPromoter';
import { UbiPromoterSocialMediaModel } from './models/ubi/ubiPromoterSocialMedia';
import { ModelCtor, Sequelize } from 'sequelize/types';

export interface DbModels {
    appUser: ModelCtor<AppUserModel>;
    appUserTrust: ModelCtor<AppUserTrustModel>;
    appProposal: ModelCtor<AppProposalModel>;
    appUserThroughTrust: ModelCtor<AppUserThroughTrustModel>;
    anonymousReport: ModelCtor<AppAnonymousReportModel>;
    cronJobExecuted: ModelCtor<CronJobExecuted>;
    exchangeRates: ModelCtor<ExchangeRates>;
    imMetadata: ModelCtor<ImMetadata>;
    reachedAddress: ModelCtor<ReachedAddress>;
    notifiedBacker: ModelCtor<NotifiedBacker>;
    appMediaContent: ModelCtor<AppMediaContentModel>;
    appMediaThumbnail: ModelCtor<AppMediaThumbnailModel>;
    appNotification: ModelCtor<AppNotificationModel>;
    ubiBeneficiarySurvey: ModelCtor<UbiBeneficiarySurveyModel>;
    //
    community: ModelCtor<Community>;
    ubiCommunitySuspect: ModelCtor<UbiCommunitySuspectModel>;
    ubiCommunityContract: ModelCtor<UbiCommunityContractModel>;
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
    ubiBeneficiaryRegistry: ModelCtor<UbiBeneficiaryRegistryModel>;
    ubiBeneficiaryTransaction: ModelCtor<UbiBeneficiaryTransactionModel>;
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
    //
    airgrabUser: ModelCtor<AirgrabUserModel>;
    airgrabProof: ModelCtor<AirgrabProofModel>;
}
export interface DbLoader {
    sequelize: Sequelize;
    models: DbModels;
}
