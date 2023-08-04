import { DbModels } from '../../../database/db';
import { Sequelize } from 'sequelize';

export function userAssociation(sequelize: Sequelize) {
    const { appUser, appLog, microCreditApplications, microCreditBorrowers, appReferralCode, microCreditNote } =
        sequelize.models as DbModels;

    appLog.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    microCreditApplications.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    microCreditBorrowers.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    appUser.hasOne(microCreditBorrowers, {
        foreignKey: 'userId',
        sourceKey: 'id',
        as: 'borrower'
    });

    appUser.hasMany(microCreditApplications, {
        foreignKey: 'userId',
        sourceKey: 'id',
        as: 'microCreditApplications'
    });

    appReferralCode.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    microCreditNote.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });
}
