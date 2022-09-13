import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    LearnAndEarnUserLesson,
    LearnAndEarnUserLessonCreation,
} from '../../../interfaces/learnAndEarn/learnAndEarnUserLesson';

export class LearnAndEarnUserLessonModel extends Model<
    LearnAndEarnUserLesson,
    LearnAndEarnUserLessonCreation
> {
    public id!: number;
    public userId!: number;
    public lessonId!: number;
    public status!: 'available' | 'started' | 'completed';
    public completionDate!: Date;
    public attempts!: number;
    public points!: number;
}

export function initializeLearnAndEarnUserLesson(
    sequelize: Sequelize
): typeof LearnAndEarnUserLessonModel {
    LearnAndEarnUserLessonModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'app_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            lessonId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'learn_and_earn_lesson',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('available', 'started', 'completed'),
                allowNull: false,
                defaultValue: 'available',
            },
            completionDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            attempts: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            points: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: 'learn_and_earn_user_lesson',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnUserLessonModel;
}
