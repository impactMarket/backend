import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../../database/db';
import {
    LearnAndEarnUserData,
    LearnAndEarnUserDataCreation
} from '../../../interfaces/learnAndEarn/learnAndEarnUserData';

export class LearnAndEarnUserDataModel extends Model<LearnAndEarnUserData, LearnAndEarnUserDataCreation> {
    public id!: number;
    public userId!: number;
    public levels!: number;
    public lessons!: number;
}

export function initializeLearnAndEarnUserData(sequelize: Sequelize): typeof LearnAndEarnUserDataModel {
    const { appUser } = sequelize.models as DbModels;
    LearnAndEarnUserDataModel.init(
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
                allowNull: false,
                unique: true
            },
            levels: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            lessons: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
        },
        {
            tableName: 'learn_and_earn_user_data',
            modelName: 'learnAndEarnUserData',
            timestamps: false,
            sequelize
        }
    );
    return LearnAndEarnUserDataModel;
}
