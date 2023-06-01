import { DbModels } from '../../../database/db';
import { Sequelize, Op } from 'sequelize';

export function learnAndEarnAssociation(sequelize: Sequelize) {
    const {
        appUser,
        learnAndEarnCategory,
        learnAndEarnLesson,
        learnAndEarnLevel,
        learnAndEarnUserLevel,
        learnAndEarnUserLesson,
        learnAndEarnPrismicLevel,
        learnAndEarnPrismicLesson,
    } = sequelize.models as DbModels;

    learnAndEarnLevel.hasMany(learnAndEarnUserLevel, {
        foreignKey: 'levelId',
        sourceKey: 'id',
        as: 'userLevel',
    });

    learnAndEarnPrismicLevel.belongsTo(learnAndEarnLevel, {
        foreignKey: 'levelId',
        as: 'level',
    });

    learnAndEarnPrismicLevel.hasMany(learnAndEarnUserLevel, {
        foreignKey: 'levelId',
        sourceKey: 'levelId',
        as: 'userLevel',
    });

    learnAndEarnPrismicLevel.hasMany(learnAndEarnPrismicLesson, {
        foreignKey: 'levelId',
        sourceKey: 'levelId',
        as: 'lesson',
    });

    learnAndEarnPrismicLesson.hasMany(learnAndEarnUserLesson, {
        foreignKey: 'levelId',
        sourceKey: 'levelId',
        as: 'userLesson',
        scope: {
            [Op.and]: sequelize.where(sequelize.col("learnAndEarnPrismicLesson.lessonId"),
                Op.eq,
                sequelize.col("userLesson.lessonId")),
        },
        constraints: false,
    });

    learnAndEarnLesson.hasMany(learnAndEarnUserLesson, {
        foreignKey: 'lessonId',
        sourceKey: 'id',
        as: 'userLesson',
    });

    learnAndEarnUserLesson.belongsTo(learnAndEarnLesson, {
        foreignKey: 'lessonId',
        as: 'lesson',
    });

    learnAndEarnLevel.hasMany(learnAndEarnLesson, {
        foreignKey: 'levelId',
        as: 'lesson',
    });

    learnAndEarnLevel.belongsTo(learnAndEarnCategory, {
        foreignKey: 'categoryId',
        as: 'category',
    });

    learnAndEarnLevel.belongsTo(appUser, {
        foreignKey: 'adminUserId',
        as: 'adminUser',
    });
}
