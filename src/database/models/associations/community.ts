import { Sequelize } from 'sequelize';

export function communityAssociation(sequelize: Sequelize) {
    // used to query from the community with incude
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
    // sequelize.models.Community.hasOne(sequelize.models.AppMediaContentModel, {
    //     // foreignKey: 'id',
    //     // sourceKey: 'coverMediaId',
    //     as: 'cover',
    // });
    // used to query from the community with incude
    sequelize.models.Community.hasOne(sequelize.models.UbiCommunityStateModel, {
        foreignKey: 'communityId',
        as: 'state',
    });
    // used to query from the community with incude
    sequelize.models.Community.hasMany(
        sequelize.models.UbiCommunityDailyStateModel,
        {
            foreignKey: 'communityId',
            as: 'dailyState',
        }
    );
    // used to query from the community with incude
    sequelize.models.Community.hasMany(
        sequelize.models.UbiCommunityDailyMetricsModel,
        {
            foreignKey: 'communityId',
            as: 'metrics',
        }
    );
    // used to query from the community with incude
    sequelize.models.Community.hasMany(sequelize.models.Beneficiary, {
        foreignKey: 'communityId',
        sourceKey: 'publicId',
        as: 'beneficiaries',
    });

    // used to query from the community with incude
    // this should be a belongsTo instead, but we want to use a third table
    sequelize.models.Community.belongsToMany(
        sequelize.models.UbiOrganizationModel,
        {
            through: sequelize.models.UbiCommunityOrganizationModel,
            sourceKey: 'id',
            foreignKey: 'communityId',
            as: 'organization',
        }
    );
    sequelize.models.UbiOrganizationModel.belongsToMany(
        sequelize.models.Community,
        {
            through: sequelize.models.UbiCommunityOrganizationModel,
            sourceKey: 'id',
            foreignKey: 'organizationId',
            as: 'organization',
        }
    );
}
