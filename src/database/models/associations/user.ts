import { Sequelize } from 'sequelize';

export function userAssociation(sequelize: Sequelize) {
    sequelize.models.Beneficiary.hasMany(sequelize.models.Claim, {
        sourceKey: 'address',
        foreignKey: 'address',
        as: 'claim',
    });

    // used to query from the beneficiary with incude
    sequelize.models.Beneficiary.belongsTo(sequelize.models.UserModel, {
        foreignKey: 'address',
        as: 'user',
    });

    // used to query from the beneficiarytransaction with incude
    sequelize.models.Beneficiary.hasMany(
        sequelize.models.BeneficiaryTransaction,
        {
            foreignKey: 'beneficiary',
            sourceKey: 'address',
            as: 'transactions',
        }
    );

    // used to query from the community with incude
    sequelize.models.UserModel.hasOne(sequelize.models.AppMediaContentModel, {
        foreignKey: 'id',
        sourceKey: 'avatarMediaId',
        as: 'avatar',
        constraints: false,
    });

    // used to query from the manager with incude
    sequelize.models.Manager.belongsTo(sequelize.models.UserModel, {
        foreignKey: 'address',
        as: 'user',
    });

    // used to query from the user with incude
    // TODO: maybe remove
    sequelize.models.UserModel.belongsToMany(
        sequelize.models.AppUserTrustModel,
        {
            through: sequelize.models.AppUserThroughTrustModel,
            foreignKey: 'userAddress',
            sourceKey: 'address',
            as: 'throughTrust',
        }
    );

    // used to query from the AppUserTrust with incude
    // TODO: maybe remove
    sequelize.models.AppUserTrustModel.belongsToMany(
        sequelize.models.UserModel,
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
        targetKey: 'publicId',
        as: 'community',
    });

    // beneficiaries are linked to manager through communityId
    sequelize.models.Manager.belongsTo(sequelize.models.Community, {
        foreignKey: 'communityId',
        targetKey: 'publicId',
        as: 'community',
    });
}
