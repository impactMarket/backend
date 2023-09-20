import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../../database/db';
import { LearnAndEarnLevelModel } from './learnAndEarnLevel';
import {
    LearnAndEarnPrismicLevel,
    LearnAndEarnPrismicLevelCreation
} from '../../../interfaces/learnAndEarn/learnAndEarnPrismicLevel';

export class LearnAndEarnPrismicLevelModel extends Model<LearnAndEarnPrismicLevel, LearnAndEarnPrismicLevelCreation> {
    public id!: number;
    public prismicId!: string;
    public levelId!: number;
    public language!: string;
    public isLive!: boolean;
    public availableAt!: Date;

    public level?: LearnAndEarnLevelModel;
}

export function initializeLearnAndEarnPrismicLevel(sequelize: Sequelize): typeof LearnAndEarnPrismicLevelModel {
    const { learnAndEarnLevel } = sequelize.models as DbModels;
    LearnAndEarnPrismicLevelModel.init(
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
                references: {
                    model: learnAndEarnLevel,
                    key: 'id'
                },
                onDelete: 'CASCADE',
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
            },
            availableAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: 'learn_and_earn_prismic_level',
            modelName: 'learnAndEarnPrismicLevel',
            timestamps: false,
            sequelize
        }
    );
    return LearnAndEarnPrismicLevelModel;
}
