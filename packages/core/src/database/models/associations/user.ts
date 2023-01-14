import { Sequelize } from 'sequelize';

export function userAssociation(sequelize: Sequelize) {
    // used to query from the beneficiary with incude
    sequelize.models.Beneficiary.belongsTo(sequelize.models.AppUserModel, {
        foreignKey: 'address',
        as: 'user',
        targetKey: 'address',
    });

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

    sequelize.models.AppLogModel.belongsTo(sequelize.models.AppUserModel, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user',
    });
}
