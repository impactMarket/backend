import { DbModels } from '../../../database/db';
import { Sequelize } from 'sequelize';

export function communityAssociation(sequelize: Sequelize) {
    const {
        community,
        ubiCommunityContract,
        ubiCommunityDailyMetrics,
        ubiPromoter,
        ubiPromoterSocialMedia,
        ubiCommunityPromoter,
        appAnonymousReport,
        manager,
        beneficiary,
        appProposal,
        appUser,
        ubiCommunityDemographics,
        merchantCommunity,
        merchantRegistry
    } = sequelize.models as DbModels;

    // used to query from the community with incude
    community.hasOne(ubiCommunityContract, {
        foreignKey: 'communityId',
        as: 'contract'
    });
    // used to query from the community with incude
    // used only at calcuateCommunitiesMetrics
    community.hasMany(ubiCommunityDailyMetrics, {
        foreignKey: 'communityId',
        as: 'metrics'
    });

    // used to query from the community with incude
    community.hasMany(beneficiary, {
        foreignKey: 'communityId',
        sourceKey: 'id',
        as: 'beneficiaries'
    });

    // used to query from the community with incude
    community.hasMany(manager, {
        foreignKey: 'communityId',
        sourceKey: 'id',
        as: 'managers'
    });

    // used to query from the promoter with incude
    ubiPromoter.belongsToMany(community, {
        through: ubiCommunityPromoter,
        foreignKey: 'promoterId',
        sourceKey: 'id',
        as: 'community'
    });
    community.belongsToMany(ubiPromoter, {
        through: ubiCommunityPromoter,
        foreignKey: 'communityId',
        sourceKey: 'id',
        as: 'promoter'
    });
    ubiPromoter.hasMany(ubiPromoterSocialMedia, {
        foreignKey: 'promoterId',
        as: 'socialMedia'
    });
    community.hasOne(appProposal, {
        foreignKey: 'id',
        sourceKey: 'proposalId',
        as: 'proposal'
    });
    community.hasOne(appUser, {
        foreignKey: 'address',
        sourceKey: 'ambassadorAddress',
        as: 'ambassador'
    });
    ubiCommunityDemographics.belongsTo(community, {
        foreignKey: 'communityId',
        as: 'community'
    });
    appAnonymousReport.belongsTo(community, {
        foreignKey: 'communityId',
        as: 'community'
    });
    merchantRegistry.hasMany(merchantCommunity, {
        foreignKey: 'merchantId',
        as: 'merchantCommunity'
    });
}
