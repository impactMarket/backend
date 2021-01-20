import { Sequelize, Options, ModelCtor } from 'sequelize';

import config from '../../config';
import initModels from '../../db/models';
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
import { GlobalDailyState } from '@models/globalDailyState';
import { ImMetadata } from '@models/imMetadata';
import { Inflow } from '@models/inflow';
import { Manager } from '@models/manager';
import { MobileError } from '@models/mobileError';
import { NotifiedBacker } from '@models/notifiedBacker';
import { ReachedAddress } from '@models/reachedAddress';
import { User } from '@models/user';
import { Logger } from '@logger/logger';
import { DbLoader } from '../../types/db';
import { GlobalDemographics } from '@models/globalDemographics';

export default (): DbLoader => {
    let logging:
        | boolean
        | ((sql: string, timing?: number | undefined) => void)
        | undefined;
    if (process.env.NODE_ENV === 'development') {
        logging = (msg) => false;
    } else {
        logging = (msg) => Logger.verbose(msg);
    }
    const dbConfig: Options = {
        dialect: 'postgres',
        protocol: 'postgres',
        native: true,
        logging,
        query: { raw: true }, // I wish, eager loading gets fixed
    };
    const sequelize = new Sequelize(config.dbUrl, dbConfig);
    initModels(sequelize);
    return {
        sequelize,
        models: {
            user: sequelize.models.User as ModelCtor<User>,
            community: sequelize.models.Community as ModelCtor<Community>,
            communityContract: sequelize.models.CommunityContract as ModelCtor<CommunityContract>,
            communityState: sequelize.models.CommunityState as ModelCtor<CommunityState>,
            communityDailyState: sequelize.models.CommunityDailyState as ModelCtor<CommunityDailyState>,
            communityDailyMetrics: sequelize.models.CommunityDailyMetrics as ModelCtor<CommunityDailyMetrics>,
            claim: sequelize.models.Claim as ModelCtor<Claim>,
            claimLocation: sequelize.models.ClaimLocation as ModelCtor<ClaimLocation>,
            beneficiary: sequelize.models.Beneficiary as ModelCtor<Beneficiary>,
            beneficiaryTransaction: sequelize.models.BeneficiaryTransaction as ModelCtor<BeneficiaryTransaction>,
            cronJobExecuted: sequelize.models.CronJobExecuted as ModelCtor<CronJobExecuted>,
            exchangeRates: sequelize.models.ExchangeRates as ModelCtor<ExchangeRates>,
            globalDailyState: sequelize.models.GlobalDailyState as ModelCtor<GlobalDailyState>,
            globalDemographics: sequelize.models.GlobalDemographics as ModelCtor<GlobalDemographics>,
            imMetadata: sequelize.models.ImMetadata as ModelCtor<ImMetadata>,
            inflow: sequelize.models.Inflow as ModelCtor<Inflow>,
            manager: sequelize.models.Manager as ModelCtor<Manager>,
            mobileError: sequelize.models.MobileError as ModelCtor<MobileError>,
            notifiedBacker: sequelize.models.NotifiedBacker as ModelCtor<NotifiedBacker>,
            reachedAddress: sequelize.models.ReachedAddress as ModelCtor<ReachedAddress>,
        },
    };
};
