import { Sequelize } from 'sequelize';

import { initializeAgenda } from './agenda';
import { initializeBeneficiary } from './beneficiary';
import { initializeBeneficiaryTransaction } from './beneficiaryTransaction';
import { initializeClaim } from './claim';
import { initializeClaimLocation } from './claimLocation';
import { initializeCommunity } from './community';
import { initializeCommunityContract } from './communityContract';
import { initializeCommunityDailyMetrics } from './communityDailyMetrics';
import { initializeCommunityDailyState } from './communityDailyState';
import { initializeCommunityState } from './communityState';
import { initializeCronJobExecuted } from './cronJobExecuted';
import { initializeExchangeRates } from './exchangeRates';
import { initializeGlobalGrowth } from './globalGrowth';
import { initializeGlobalDailyState } from './globalDailyState';
import { initializeGlobalDemographics } from './globalDemographics';
import { initializeImMetadata } from './imMetadata';
import { initializeInflow } from './inflow';
import { initializeManager } from './manager';
import { initializeMobileError } from './mobileError';
import { initializeNotifiedBacker } from './notifiedBacker';
import { initializeReachedAddress } from './reachedAddress';
import { initializeSSI } from './ssi';
import { initializeTransactions } from './transactions';
import initializeUser from './user';
import { initializeStoriesContent } from './stories/storiesContent';
import { initializeStoriesCommunity } from './stories/storiesCommunity';
import { initializeStoriesEngagement } from './stories/storiesEngagement';

export default function initModels(sequelize: Sequelize): void {
    initializeCommunity(sequelize);
    initializeSSI(sequelize);
    initializeTransactions(sequelize);
    initializeUser(sequelize);
    initializeAgenda(sequelize);
    initializeClaimLocation(sequelize);
    initializeExchangeRates(sequelize);
    initializeNotifiedBacker(sequelize);
    initializeImMetadata(sequelize);
    initializeBeneficiary(sequelize);
    initializeManager(sequelize);
    initializeClaim(sequelize);
    initializeInflow(sequelize);
    initializeCommunityState(sequelize);
    initializeCommunityDailyState(sequelize);
    initializeCommunityDailyMetrics(sequelize);
    initializeMobileError(sequelize);
    initializeCommunityContract(sequelize);
    initializeGlobalDailyState(sequelize);
    initializeReachedAddress(sequelize);
    initializeCronJobExecuted(sequelize);
    initializeBeneficiaryTransaction(sequelize);
    initializeGlobalDemographics(sequelize);
    initializeGlobalGrowth(sequelize);

    // stories
    initializeStoriesContent(sequelize);
    initializeStoriesCommunity(sequelize);
    initializeStoriesEngagement(sequelize);

    sequelize.models.Community.hasMany(sequelize.models.StoriesCommunityModel, {
        foreignKey: 'communityId',
        as: 'storyCommunity',
    });
    // used to query from the community with incude
    sequelize.models.StoriesCommunityModel.belongsTo(
        sequelize.models.StoriesContentModel,
        {
            foreignKey: 'contentId',
            as: 'storyContent',
        }
    );
    // used to post from the content with incude
    sequelize.models.StoriesContentModel.hasOne(
        sequelize.models.StoriesCommunityModel,
        {
            foreignKey: 'contentId',
            as: 'storyContent',
        }
    );

    // used to query from the community with incude
    sequelize.models.StoriesEngagementModel.belongsTo(
        sequelize.models.StoriesContentModel,
        {
            foreignKey: 'contentId',
            as: 'storyEngage',
        }
    );
    // used to post from the content with incude
    sequelize.models.StoriesContentModel.hasOne(
        sequelize.models.StoriesEngagementModel,
        {
            foreignKey: 'contentId',
            as: 'storyEngage',
        }
    );

    // this actually works, but eager loading not so much!
    // sequelize.models.Manager.belongsTo(sequelize.models.User, {
    //     foreignKey: 'user',
    //     targetKey: 'address',
    // });

    // sequelize.models.User.hasOne(sequelize.models.Manager, {
    //     foreignKey: 'user',
    // });
}
