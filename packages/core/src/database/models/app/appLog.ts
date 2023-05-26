import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    AppLog,
    AppLogCreation,
    LogTypes,
} from '../../../interfaces/app/appLog';
import { DbModels } from '../../../database/db';

export class AppLogModel extends Model<AppLog, AppLogCreation> {
    public id!: number;
    public userId!: number;
    public type!: LogTypes;
    public detail!: object;
    public communityId!: number;
    public createdAt!: Date;
}

export function initializeAppLog(sequelize: Sequelize): void {
    const { appUser } = sequelize.models as DbModels;
    AppLogModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: appUser,
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },
            detail: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            communityId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: new Date(),
            },
        },
        {
            tableName: 'app_log',
            modelName: 'appLog',
            updatedAt: false,
            sequelize,
        }
    );
}
