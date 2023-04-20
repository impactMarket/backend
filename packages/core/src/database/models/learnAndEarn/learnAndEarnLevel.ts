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
    public prismicId!: string; // TODO: remove
    public categoryId!: number; // TODO: remove
    public languages?: string[]; // TODO: remove
    public active!: boolean; // TODO: remove
    public isLive!: boolean; // TODO: remove
    public title!: string;
    public totalReward!: number;
    public rewardLimit?: number;
    public asset!: string;
    public adminUserId!: number;
    public status!: string;
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
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            prismicId: {
                type: DataTypes.STRING(32),
                allowNull: true,
            },
            categoryId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'learn_and_earn_category',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: true,
            },
            languages: {
                type: DataTypes.ARRAY(DataTypes.STRING(3)),
                allowNull: true,
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
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
            adminUserId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'app_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM(
                    'pending',
                    'aproved',
                    'declined',
                    'published'
                ),
                allowNull: false,
                defaultValue: 'pending',
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
