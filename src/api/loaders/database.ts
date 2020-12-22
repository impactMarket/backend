import { Sequelize, Options, ModelCtor } from 'sequelize';

import config from '../../config';
import initModels from '../../db/models';
import { Beneficiary } from '../../db/models/beneficiary';
import { BeneficiaryTransaction } from '../../db/models/beneficiaryTransaction';
import { Claim } from '../../db/models/claim';
import { ClaimLocation } from '../../db/models/claimLocation';
import { Community } from '../../db/models/community';
import { CommunityContract } from '../../db/models/communityContract';
import { CommunityDailyMetrics } from '../../db/models/communityDailyMetrics';
import { CommunityDailyState } from '../../db/models/communityDailyState';
import { CommunityState } from '../../db/models/communityState';
import { CronJobExecuted } from '../../db/models/cronJobExecuted';
import { ExchangeRates } from '../../db/models/exchangeRates';
import { GlobalDailyState } from '../../db/models/globalDailyState';
import { ImMetadata } from '../../db/models/imMetadata';
import { Inflow } from '../../db/models/inflow';
import { Manager } from '../../db/models/manager';
import { MobileError } from '../../db/models/mobileError';
import { NotifiedBacker } from '../../db/models/notifiedBacker';
import { ReachedAddress } from '../../db/models/reachedAddress';
import { User } from '../../db/models/user';
import { Logger } from './logger';
import { DbLoader } from '../../types/db';

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
        query: { raw: true }, //TODO: in order to eager loading to work, this needs to be removed
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
            imMetadata: sequelize.models.ImMetadata as ModelCtor<ImMetadata>,
            inflow: sequelize.models.Inflow as ModelCtor<Inflow>,
            manager: sequelize.models.Manager as ModelCtor<Manager>,
            mobileError: sequelize.models.MobileError as ModelCtor<MobileError>,
            notifiedBacker: sequelize.models.NotifiedBacker as ModelCtor<NotifiedBacker>,
            reachedAddress: sequelize.models.ReachedAddress as ModelCtor<ReachedAddress>,
        },
    };
};
