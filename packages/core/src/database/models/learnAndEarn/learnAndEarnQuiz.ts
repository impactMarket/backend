import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    LearnAndEarnQuiz,
    LearnAndEarnQuizCreation,
} from '../../../interfaces/learnAndEarn/learnAndEarnQuiz';

export class LearnAndEarnQuizModel extends Model<
    LearnAndEarnQuiz,
    LearnAndEarnQuizCreation
> {
    public id!: number;
    public order!: number;
    public lessonId!: number;
    public active!: boolean;
    public answer!: number;
}

export function initializeLearnAndEarnQuiz(
    sequelize: Sequelize
): typeof LearnAndEarnQuizModel {
    LearnAndEarnQuizModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            order: {
                type: DataTypes.INTEGER,
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
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            answer: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: 'learn_and_earn_quiz',
            modelName: 'learnAndEarnQuiz',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnQuizModel;
}
