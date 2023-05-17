import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    LearnAndEarnLesson,
    LearnAndEarnLessonCreation,
} from '../../../interfaces/learnAndEarn/learnAndEarnLesson';

export class LearnAndEarnLessonModel extends Model<
    LearnAndEarnLesson,
    LearnAndEarnLessonCreation
> {
    public id!: number;
    public prismicId!: string;
    public levelId!: number;
    public languages?: string[];
    public active!: boolean;
    public isLive!: boolean;
}

export function initializeLearnAndEarnLesson(
    sequelize: Sequelize
): typeof LearnAndEarnLessonModel {
    LearnAndEarnLessonModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            prismicId: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },
            levelId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'learn_and_earn_level',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            languages: {
                type: DataTypes.ARRAY(DataTypes.STRING(3)),
                allowNull: true,
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            isLive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            tableName: 'learn_and_earn_lesson',
            modelName: 'learnAndEarnLesson',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnLessonModel;
}
