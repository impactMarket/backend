import { Sequelize } from 'sequelize';

export function userAssociation(sequelize: Sequelize) {
    // used to query from the beneficiary with incude
    sequelize.models.Beneficiary.belongsTo(sequelize.models.AppUserModel, {
        foreignKey: 'address',
        as: 'user',
        targetKey: 'address',
    });

    // used to query from the ubiBeneficiaryRegistry with incude
    sequelize.models.UbiBeneficiaryRegistryModel.belongsTo(
        sequelize.models.AppUserModel,
        {
            foreignKey: 'from',
            as: 'user',
            targetKey: 'address',
        }
    );

    // used to query from the community with incude
    sequelize.models.AppUserModel.hasOne(
        sequelize.models.AppMediaContentModel,
        {
            foreignKey: 'id',
            sourceKey: 'avatarMediaId',
            as: 'avatar',
            constraints: false,
        }
    );

    // used to query from the manager with incude
    sequelize.models.Manager.belongsTo(sequelize.models.AppUserModel, {
        foreignKey: 'address',
        as: 'user',
        targetKey: 'address',
    });

    // used to query from the user with incude
    sequelize.models.AppUserModel.belongsToMany(
        sequelize.models.AppUserTrustModel,
        {
            through: sequelize.models.AppUserThroughTrustModel,
            foreignKey: 'userAddress',
            sourceKey: 'address',
            as: 'trust',
        }
    );

    // used to query from the AppUserTrust with incude
    // TODO: maybe remove
    sequelize.models.AppUserTrustModel.belongsToMany(
        sequelize.models.AppUserModel,
        {
            through: sequelize.models.AppUserThroughTrustModel,
            foreignKey: 'appUserTrustId',
            sourceKey: 'id',
            as: 'throughTrust',
        }
    );

    // self association to find repeated values on those keys
    sequelize.models.AppUserTrustModel.hasMany(
        sequelize.models.AppUserTrustModel,
        {
            foreignKey: 'phone',
            sourceKey: 'phone',
            as: 'selfTrust',
        }
    );

    // beneficiaries are linked to manager through communityId
    sequelize.models.Beneficiary.belongsTo(sequelize.models.Community, {
        foreignKey: 'communityId',
        targetKey: 'id',
        as: 'community',
    });

    // beneficiaries are linked to manager through communityId
    sequelize.models.Manager.belongsTo(sequelize.models.Community, {
        foreignKey: 'communityId',
        targetKey: 'id',
        as: 'community',
    });

    // Managers are linked to BeneficiaryRegistry through from
    sequelize.models.Manager.hasMany(
        sequelize.models.UbiBeneficiaryRegistryModel,
        {
            foreignKey: 'from',
            sourceKey: 'address',
            as: 'added',
        }
    );

    sequelize.models.AppLogModel.belongsTo(sequelize.models.AppUserModel, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user',
    });
}
