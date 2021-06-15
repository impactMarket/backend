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
    sequelize.models.Community.hasMany(
        sequelize.models.UbiCommunityLabelModel,
        {
            foreignKey: 'communityId',
            as: 'labels',
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
    sequelize.models.Community.hasMany(
        sequelize.models.UbiCommunityDemographicsModel,
        {
            foreignKey: 'communityId',
            as: 'demographics',
        }
    );
    // used to query from the community with incude
    sequelize.models.Community.hasMany(sequelize.models.ClaimLocation, {
        foreignKey: 'communityId',
        sourceKey: 'publicId',
        as: 'claimLocation',
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
    sequelize.models.Community.hasMany(sequelize.models.Inflow, {
        foreignKey: 'communityId',
        sourceKey: 'publicId',
        as: 'inflow',
    });
    // sequelize.models.Community.hasMany(
    //     sequelize.models.BeneficiaryTransaction,
    //     {
    //         foreignKey: 'communityId',
    //         sourceKey: 'publicId',
    //         as: 'beneficiaryTxs',
    //     }
    // );
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
            sourceKey: 'id',
            foreignKey: 'promoterId',
            as: 'community',
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
