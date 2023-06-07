import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    LearnAndEarnPrismicLevel,
    LearnAndEarnPrismicLevelCreation,
} from '../../../interfaces/learnAndEarn/learnAndEarnPrismicLevel';
import { DbModels } from '../../../database/db';

export class LearnAndEarnPrismicLevelModel extends Model<
    LearnAndEarnPrismicLevel,
    LearnAndEarnPrismicLevelCreation
> {
    public id!: number;
    public prismicId!: string;
    public levelId!: number;
    public language!: string;
    public isLive!: boolean;
}

export function initializeLearnAndEarnPrismicLevel(
    sequelize: Sequelize
): typeof LearnAndEarnPrismicLevelModel {
    const { learnAndEarnLevel } = sequelize.models as DbModels;
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
                    model: learnAndEarnLevel,
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: true,
            },
            language: {
                type: DataTypes.STRING(2),
                allowNull: false,
            },
            isLive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            tableName: 'learn_and_earn_prismic_level',
            modelName: 'learnAndEarnPrismicLevel',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnPrismicLevelModel;
}
