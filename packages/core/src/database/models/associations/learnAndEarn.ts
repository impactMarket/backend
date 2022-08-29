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

    sequelize.models.LearnAndEarnLessonModel.hasMany(
        sequelize.models.LearnAndEarnUserLessonModel,
        {
            foreignKey: 'lessonId',
            sourceKey: 'id',
            as: 'userLesson',
        }
    );
}
