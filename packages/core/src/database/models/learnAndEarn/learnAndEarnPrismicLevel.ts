import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    LearnAndEarnPrismicLevel,
    LearnAndEarnPrismicLevelCreation,
} from '../../../interfaces/learnAndEarn/learnAndEarnPrismicLevel';

export class LearnAndEarnPrismicLevelModel extends Model<
    LearnAndEarnPrismicLevel,
    LearnAndEarnPrismicLevelCreation
> {
    public id!: number;
    public prismicId!: string;
    public levelId!: number;
    public language!: string;
}

export function initializeLearnAndEarnPrismicLevel(
    sequelize: Sequelize
): typeof LearnAndEarnPrismicLevelModel {
    LearnAndEarnPrismicLevelModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            prismicId: {
                type: DataTypes.STRING(32),
                allowNull: true,
            },
            levelId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'learn_and_earn_level',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: true,
            },
            language: {
                type: DataTypes.STRING(2),
                allowNull: false,
            },
        },
        {
            tableName: 'learn_and_earn_prismic_level',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnPrismicLevelModel;
}
