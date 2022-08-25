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
    public prismicId!: string;
    public lessonId!: number;
    public active!: boolean;
    public answerId!: string;
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
            prismicId: {
                type: DataTypes.STRING(32),
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
            answerId: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },
        },
        {
            tableName: 'learn_and_earn_quiz',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnQuizModel;
}
