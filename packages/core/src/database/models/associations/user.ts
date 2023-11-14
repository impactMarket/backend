import { DbModels } from '../../../database/db';
import { Sequelize } from 'sequelize';

export function userAssociation(sequelize: Sequelize) {
    const {
        appUser,
        appLog,
        appLazyAgenda,
        microCreditApplications,
        microCreditBorrowers,
        appReferralCode,
        microCreditNote,
        subgraphMicroCreditBorrowers,
        microCreditLoanManager,
        subgraphUBIBeneficiary
    } = sequelize.models as DbModels;

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

    appUser.hasMany(microCreditBorrowers, {
        foreignKey: 'userId',
        sourceKey: 'id',
        as: 'borrower'
    });

    appUser.hasMany(microCreditApplications, {
        foreignKey: 'userId',
        sourceKey: 'id',
        as: 'microCreditApplications'
    });

    subgraphUBIBeneficiary.belongsTo(appUser, {
        foreignKey: 'userAddress',
        targetKey: 'address',
        as: 'user'
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

    microCreditNote.belongsTo(appUser, {
        foreignKey: 'managerId',
        targetKey: 'id',
        as: 'manager'
    });

    microCreditBorrowers.hasOne(subgraphMicroCreditBorrowers, {
        foreignKey: 'userId',
        sourceKey: 'userId',
        as: 'loan'
    });

    subgraphMicroCreditBorrowers.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    microCreditLoanManager.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    appLazyAgenda.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    subgraphMicroCreditBorrowers.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });
}
