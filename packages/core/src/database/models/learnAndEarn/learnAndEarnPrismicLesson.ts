import { DataTypes, Model, Sequelize } from 'sequelize';

import {
    LearnAndEarnPrismicLesson,
    LearnAndEarnPrismicLessonCreation
} from '../../../interfaces/learnAndEarn/learnAndEarnPrismicLesson';

export class LearnAndEarnPrismicLessonModel extends Model<
    LearnAndEarnPrismicLesson,
    LearnAndEarnPrismicLessonCreation
> {
    public id!: number;
    public prismicId!: string;
    public levelId!: number;
    public lessonId!: number;
    public language!: string;
    public isLive!: boolean;
}

export function initializeLearnAndEarnPrismicLesson(sequelize: Sequelize): typeof LearnAndEarnPrismicLessonModel {
    LearnAndEarnPrismicLessonModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            prismicId: {
                type: DataTypes.STRING(32),
                allowNull: true
            },
            levelId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            lessonId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            language: {
                type: DataTypes.STRING(2),
                allowNull: false
            },
            isLive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        },
        {
            tableName: 'learn_and_earn_prismic_lesson',
            modelName: 'learnAndEarnPrismicLesson',
            timestamps: false,
            sequelize
        }
    );
    return LearnAndEarnPrismicLessonModel;
}
