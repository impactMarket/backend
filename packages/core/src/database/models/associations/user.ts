import { DbModels } from '../../../database/db';
import { Sequelize } from 'sequelize';

export function userAssociation(sequelize: Sequelize) {
    const {
        appUser,
        beneficiary,
        manager,
        community,
        appLog,
        microCreditApplications,
        microCreditBorrowers,
        appReferralCode,
        microCreditNote
    } = sequelize.models as DbModels;
    // used to query from the beneficiary with incude
    beneficiary.belongsTo(appUser, {
        foreignKey: 'address',
        as: 'user',
        targetKey: 'address'
    });

    // used to query from the manager with incude
    manager.belongsTo(appUser, {
        foreignKey: 'address',
        as: 'user',
        targetKey: 'address'
    });

    // beneficiaries are linked to manager through communityId
    beneficiary.belongsTo(community, {
        foreignKey: 'communityId',
        targetKey: 'id',
        as: 'community'
    });

    // beneficiaries are linked to manager through communityId
    manager.belongsTo(community, {
        foreignKey: 'communityId',
        targetKey: 'id',
        as: 'community'
    });

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

    microCreditNote.belongsTo(appUser, {
        foreignKey: 'managerId',
        targetKey: 'id',
        as: 'manager'
    });
}
