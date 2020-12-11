import { Sequelize, Options, ModelCtor } from 'sequelize';

import config from '../config';
import initModels from '../db/models';
import { Community } from '../db/models/community';
import { CommunityContract } from '../db/models/communityContract';
import { CommunityDailyMetrics } from '../db/models/communityDailyMetrics';
import { CommunityDailyState } from '../db/models/communityDailyState';
import { CommunityState } from '../db/models/communityState';
import { User } from '../db/models/user';
import { Logger } from '../loaders/logger';
import { DbLoader } from '../types';

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
        },
    };
};
