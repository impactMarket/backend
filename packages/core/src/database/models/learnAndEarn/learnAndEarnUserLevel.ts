import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../../database/db';
import {
    LearnAndEarnUserLevel,
    LearnAndEarnUserLevelCreation
} from '../../../interfaces/learnAndEarn/learnAndEarnUserLevel';

export class LearnAndEarnUserLevelModel extends Model<LearnAndEarnUserLevel, LearnAndEarnUserLevelCreation> {
    public id!: number;
    public userId!: number;
    public levelId!: number;
    public status!: 'available' | 'started' | 'completed';
    public completionDate!: Date;

    public readonly createdAt!: Date;
}

export function initializeLearnAndEarnUserLevel(sequelize: Sequelize): typeof LearnAndEarnUserLevelModel {
    const { appUser, learnAndEarnLevel } = sequelize.models as DbModels;
    LearnAndEarnUserLevelModel.init(
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
            levelId: {
                type: DataTypes.INTEGER,
                references: {
                    model: learnAndEarnLevel,
                    key: 'id'
                },
                onDelete: 'CASCADE',
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
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        },
        {
            tableName: 'learn_and_earn_user_level',
            modelName: 'learnAndEarnUserLevel',
            timestamps: false,
            updatedAt: false,
            sequelize
        }
    );
    return LearnAndEarnUserLevelModel;
}
