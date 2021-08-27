import { Sequelize } from 'sequelize';

export function communityAssociation(sequelize: Sequelize) {
    // used to query from the community with incude
    // TODO: to be removed
    sequelize.models.Community.hasMany(
        sequelize.models.UbiCommunitySuspectModel,
        {
            foreignKey: 'communityId',
            as: 'suspect',
        }
    );
    // used to query from the community with incude
    sequelize.models.Community.hasOne(
        sequelize.models.UbiCommunityContractModel,
        {
            foreignKey: 'communityId',
            as: 'contract',
        }
    );
    // used to query from the community with incude
    sequelize.models.Community.hasOne(sequelize.models.AppMediaContentModel, {
        foreignKey: 'id',
        sourceKey: 'coverMediaId',
        as: 'cover',
        constraints: false,
    });
    // used to query from the community with incude
    sequelize.models.Community.hasOne(sequelize.models.UbiCommunityStateModel, {
        foreignKey: 'communityId',
        as: 'state',
    });
    // used to query from the community with incude
    // TODO: used only once, should be removed
    sequelize.models.Community.hasMany(
        sequelize.models.UbiCommunityDailyStateModel,
        {
            foreignKey: 'communityId',
            as: 'dailyState',
        }
    );
    // used to query from the community with incude
    // used only at calcuateCommunitiesMetrics
    sequelize.models.Community.hasMany(
        sequelize.models.UbiCommunityDailyMetricsModel,
        {
            foreignKey: 'communityId',
            as: 'metrics',
        }
    );

    // used to query from the community with incude
    sequelize.models.Community.hasMany(sequelize.models.Inflow, {
        foreignKey: 'communityId',
        sourceKey: 'publicId',
        as: 'inflow',
    });
    // used to query from the community with incude
    sequelize.models.Community.hasMany(sequelize.models.Beneficiary, {
        foreignKey: 'communityId',
        sourceKey: 'publicId',
        as: 'beneficiaries',
    });

    // used to query from the promoter with incude
    sequelize.models.UbiPromoterModel.belongsToMany(
        sequelize.models.Community,
        {
            through: sequelize.models.UbiCommunityPromoterModel,
            foreignKey: 'promoterId',
            sourceKey: 'id',
            as: 'community',
        }
    );
    sequelize.models.Community.belongsToMany(
        sequelize.models.UbiPromoterModel,
        {
            through: sequelize.models.UbiCommunityPromoterModel,
            foreignKey: 'communityId',
            sourceKey: 'id',
            as: 'promoter',
        }
    );
    sequelize.models.UbiPromoterModel.hasMany(
        sequelize.models.UbiPromoterSocialMediaModel,
        {
            foreignKey: 'promoterId',
            as: 'socialMedia',
        }
    );
    sequelize.models.UbiPromoterModel.hasOne(
        sequelize.models.AppMediaContentModel,
        {
            foreignKey: 'id',
            sourceKey: 'logoMediaId',
            as: 'logo',
            constraints: false,
        }
    );
}
