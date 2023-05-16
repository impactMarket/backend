import { Sequelize } from 'sequelize';

export function learnAndEarnAssociation(sequelize: Sequelize) {
    sequelize.models.LearnAndEarnLevelModel.hasMany(
        sequelize.models.LearnAndEarnUserLevelModel,
        {
            foreignKey: 'levelId',
            sourceKey: 'id',
            as: 'userLevel',
        }
    );

    sequelize.models.LearnAndEarnPrismicLevelModel.hasMany(
        sequelize.models.LearnAndEarnUserLevelModel,
        {
            foreignKey: 'levelId',
            sourceKey: 'levelId',
            as: 'userLevel',
        }
    );

    sequelize.models.LearnAndEarnPrismicLevelModel.hasMany(
        sequelize.models.LearnAndEarnPrismicLessonModel,
        {
            foreignKey: 'levelId',
            sourceKey: 'levelId',
            as: 'lesson',
        }
    );

    sequelize.models.LearnAndEarnPrismicLessonModel.hasMany(
        sequelize.models.LearnAndEarnUserLessonModel,
        {
            foreignKey: 'levelId',
            sourceKey: 'levelId',
            as: 'userLesson',
        }
    );

    sequelize.models.LearnAndEarnLessonModel.hasMany(
        sequelize.models.LearnAndEarnUserLessonModel,
        {
            foreignKey: 'lessonId',
            sourceKey: 'id',
            as: 'userLesson',
        }
    );

    sequelize.models.LearnAndEarnUserLessonModel.belongsTo(
        sequelize.models.LearnAndEarnLessonModel,
        {
            foreignKey: 'lessonId',
            as: 'lesson',
        }
    );

    sequelize.models.LearnAndEarnLevelModel.hasMany(
        sequelize.models.LearnAndEarnLessonModel,
        {
            foreignKey: 'levelId',
            as: 'lesson',
        }
    );

    sequelize.models.LearnAndEarnLevelModel.belongsTo(
        sequelize.models.LearnAndEarnCategoryModel,
        {
            foreignKey: 'categoryId',
            as: 'category',
        }
    );
}
