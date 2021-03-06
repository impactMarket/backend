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
import { ModelCtor, Sequelize } from 'sequelize/types';
import { AppUserDeviceModel } from '@models/app/userDevice';

export interface DbModels {
    user: ModelCtor<UserModel>;
    community: ModelCtor<Community>;
    communityContract: ModelCtor<CommunityContract>;
    communityState: ModelCtor<CommunityState>;
    communityDailyState: ModelCtor<CommunityDailyState>;
    communityDailyMetrics: ModelCtor<CommunityDailyMetrics>;
    claim: ModelCtor<Claim>;
    claimLocation: ModelCtor<ClaimLocation>;
    beneficiary: ModelCtor<Beneficiary>;
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
}
export interface DbLoader {
    sequelize: Sequelize;
    models: DbModels;
}
