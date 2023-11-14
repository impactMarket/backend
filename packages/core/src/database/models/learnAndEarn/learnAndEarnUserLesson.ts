import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../../database/db';
import {
    LearnAndEarnUserLesson,
    LearnAndEarnUserLessonCreation
} from '../../../interfaces/learnAndEarn/learnAndEarnUserLesson';

export class LearnAndEarnUserLessonModel extends Model<LearnAndEarnUserLesson, LearnAndEarnUserLessonCreation> {
    public id!: number;
    public userId!: number;
    public lessonId!: number;
    public levelId!: number;
    public status!: 'available' | 'started' | 'completed';
    public completionDate!: Date;
    public attempts!: number;
    public points!: number;

    public readonly createdAt!: Date;
}

export function initializeLearnAndEarnUserLesson(sequelize: Sequelize): typeof LearnAndEarnUserLessonModel {
    const { appUser } = sequelize.models as DbModels;
    LearnAndEarnUserLessonModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: appUser,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            lessonId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            levelId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('available', 'started', 'completed'),
                allowNull: false,
                defaultValue: 'available'
            },
            completionDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            attempts: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            points: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            }
        },
        {
            tableName: 'learn_and_earn_user_lesson',
            modelName: 'learnAndEarnUserLesson',
            updatedAt: false,
            sequelize
        }
    );
    return LearnAndEarnUserLessonModel;
}
