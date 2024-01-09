import { DbModels } from '../../../database/db';
import { Op, Sequelize } from 'sequelize';

export function learnAndEarnAssociation(sequelize: Sequelize) {
    const {
        appUser,
        learnAndEarnLesson,
        learnAndEarnLevel,
        learnAndEarnUserLevel,
        learnAndEarnUserLesson,
        learnAndEarnPrismicLevel,
        learnAndEarnPrismicLesson,
        learnAndEarnPayment,
        appNotification
    } = sequelize.models as DbModels;

    learnAndEarnLevel.hasMany(learnAndEarnUserLevel, {
        foreignKey: 'levelId',
        sourceKey: 'id',
        as: 'userLevel'
    });

    learnAndEarnPrismicLevel.belongsTo(learnAndEarnLevel, {
        foreignKey: 'levelId',
        as: 'level'
    });

    learnAndEarnPrismicLevel.hasMany(learnAndEarnUserLevel, {
        foreignKey: 'levelId',
        sourceKey: 'levelId',
        as: 'userLevel'
    });

    learnAndEarnUserLevel.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    learnAndEarnUserLevel.belongsTo(appNotification, {
        foreignKey: 'userId',
        targetKey: 'userId',
        as: 'notifications'
    });

    learnAndEarnPrismicLevel.hasMany(learnAndEarnPrismicLesson, {
        foreignKey: 'levelId',
        sourceKey: 'levelId',
        as: 'lesson'
    });

    learnAndEarnPrismicLesson.hasMany(learnAndEarnUserLesson, {
        foreignKey: 'levelId',
        sourceKey: 'levelId',
        as: 'userLesson',
        scope: {
            [Op.and]: sequelize.where(
                sequelize.col('learnAndEarnPrismicLesson.lessonId'),
                Op.eq,
                sequelize.col('userLesson.lessonId')
            )
        },
        constraints: false
    });

    learnAndEarnLesson.hasMany(learnAndEarnUserLesson, {
        foreignKey: 'lessonId',
        sourceKey: 'id',
        as: 'userLesson'
    });

    learnAndEarnUserLesson.belongsTo(learnAndEarnLesson, {
        foreignKey: 'lessonId',
        as: 'lesson'
    });

    learnAndEarnLevel.hasMany(learnAndEarnLesson, {
        foreignKey: 'levelId',
        as: 'lesson'
    });

    learnAndEarnLevel.belongsTo(appUser, {
        foreignKey: 'adminUserId',
        targetKey: 'id',
        as: 'adminUser'
    });

    learnAndEarnPayment.belongsTo(learnAndEarnLevel, {
        foreignKey: 'levelId',
        targetKey: 'id',
        as: 'level'
    });
}
