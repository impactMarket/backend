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
        foreignKey: 'contractAddress',
        sourceKey: 'contractAddress',
        as: 'inflow',
    });
    // used to query from the community with incude
    sequelize.models.Community.hasMany(sequelize.models.Beneficiary, {
        foreignKey: 'communityId',
        sourceKey: 'id',
        as: 'beneficiaries',
    });

    // used to query from the community with incude
    sequelize.models.Community.hasMany(sequelize.models.Manager, {
        foreignKey: 'communityId',
        sourceKey: 'id',
        as: 'managers',
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
    sequelize.models.Community.hasOne(sequelize.models.AppProposalModel, {
        foreignKey: 'id',
        sourceKey: 'proposalId',
        as: 'proposal',
    });
    sequelize.models.Community.hasMany(sequelize.models.UbiClaimModel, {
        foreignKey: 'communityId',
        sourceKey: 'id',
        as: 'claims',
    });
    sequelize.models.Community.hasOne(sequelize.models.AppUserModel, {
        foreignKey: 'address',
        sourceKey: 'ambassadorAddress',
        as: 'ambassador',
    });
    sequelize.models.UbiCommunityDemographicsModel.belongsTo(sequelize.models.Community, {
        foreignKey: 'communityId',
        as: 'community',
    });
    sequelize.models.AppAnonymousReportModel.belongsTo(sequelize.models.Community, {
        foreignKey: 'communityId',
        as: 'community',
    });
}
