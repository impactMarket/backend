import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    LearnAndEarnLevel,
    LearnAndEarnLevelCreation,
} from '../../../interfaces/learnAndEarn/learnAndEarnLevel';

export class LearnAndEarnLevelModel extends Model<
    LearnAndEarnLevel,
    LearnAndEarnLevelCreation
> {
    public id!: number;
    public prismicId!: string;
    public categoryId!: number;
    public languages?: string[];
    public active!: boolean;
    public isLive!: boolean;
    public totalReward!: number;
    public rewardLimit?: number;
}

export function initializeLearnAndEarnLevel(
    sequelize: Sequelize
): typeof LearnAndEarnLevelModel {
    LearnAndEarnLevelModel.init(
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
            categoryId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'learn_and_earn_category',
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
            totalReward: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            rewardLimit: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            isLive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            tableName: 'learn_and_earn_level',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnLevelModel;
}
