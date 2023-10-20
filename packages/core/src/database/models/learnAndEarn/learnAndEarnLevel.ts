import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppUserModel } from '../app/appUser';
import { DbModels } from '../../../database/db';
import { LearnAndEarnLevel, LearnAndEarnLevelCreation } from '../../../interfaces/learnAndEarn/learnAndEarnLevel';
import { LearnAndEarnUserLevelModel } from './learnAndEarnUserLevel';

export class LearnAndEarnLevelModel extends Model<LearnAndEarnLevel, LearnAndEarnLevelCreation> {
    public id!: number;
    public lessons!: number;
    public clients!: number[];
    public totalReward!: number;
    public rewardLimit?: number;
    public asset!: string;
    public adminUserId!: number;
    public status!: string;
    public rules!: {
        countries: string[];
        roles: string[];
        limitUsers: number;
    };

    public adminUser?: AppUserModel;
    public userLevel?: LearnAndEarnUserLevelModel;
}

export function initializeLearnAndEarnLevel(sequelize: Sequelize): typeof LearnAndEarnLevelModel {
    const { appUser } = sequelize.models as DbModels;
    LearnAndEarnLevelModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            totalReward: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0
            },
            rewardLimit: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            lessons: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            asset: {
                type: DataTypes.STRING(44),
                allowNull: true
            },
            clients: {
                type: DataTypes.ARRAY(DataTypes.INTEGER),
                allowNull: false,
                defaultValue: [1]
            },
            rules: {
                type: DataTypes.JSONB,
                allowNull: true
            },
            adminUserId: {
                type: DataTypes.INTEGER,
                references: {
                    model: appUser,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('pending', 'aproved', 'declined', 'published'),
                allowNull: false,
                defaultValue: 'pending'
            }
        },
        {
            tableName: 'learn_and_earn_level',
            modelName: 'learnAndEarnLevel',
            timestamps: false,
            sequelize
        }
    );
    return LearnAndEarnLevelModel;
}
