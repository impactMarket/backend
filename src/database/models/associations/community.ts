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
            as: 'organization',
        }
    );
}
