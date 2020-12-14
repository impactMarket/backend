import { ModelCtor, Sequelize } from 'sequelize/types';
import { Beneficiary } from '../db/models/beneficiary';
import { BeneficiaryTransaction } from '../db/models/beneficiaryTransaction';
import { Claim } from '../db/models/claim';
import { ClaimLocation } from '../db/models/claimLocation';
import { Community } from '../db/models/community';
import { CommunityContract } from '../db/models/communityContract';
import { CommunityDailyMetrics } from '../db/models/communityDailyMetrics';
import { CommunityDailyState } from '../db/models/communityDailyState';
import { CommunityState } from '../db/models/communityState';
import { CronJobExecuted } from '../db/models/cronJobExecuted';
import { ExchangeRates } from '../db/models/exchangeRates';
import { GlobalDailyState } from '../db/models/globalDailyState';
import { ImMetadata } from '../db/models/imMetadata';
import { Inflow } from '../db/models/inflow';
import { Manager } from '../db/models/manager';
import { MobileError } from '../db/models/mobileError';
import { NotifiedBacker } from '../db/models/notifiedBacker';
import { ReachedAddress } from '../db/models/reachedAddress';
import { User } from '../db/models/user';

export interface DbModels {
    user: ModelCtor<User>;
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
    imMetadata: ModelCtor<ImMetadata>;
    inflow: ModelCtor<Inflow>;
    manager: ModelCtor<Manager>;
    mobileError: ModelCtor<MobileError>;
    notifiedBacker: ModelCtor<NotifiedBacker>;
    reachedAddress: ModelCtor<ReachedAddress>;
}
export interface DbLoader {
    sequelize: Sequelize;
    models: DbModels;
}