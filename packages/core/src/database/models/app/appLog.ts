import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    AppLog,
    AppLogCreation,
    LogTypes,
} from '../../../interfaces/app/appLog';

export class AppLogModel extends Model<AppLog, AppLogCreation> {
    public id!: number;
    public userId!: number;
    public type!: LogTypes;
    public detail!: object;
    public communityId!: number;
    public createdAt!: Date;
}

export function initializeAppLog(sequelize: Sequelize): void {
    AppLogModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
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
            updatedAt: false,
            sequelize,
        }
    );
}
