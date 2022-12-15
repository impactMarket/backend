import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    AppNotification,
    AppNotificationCreation,
} from '../../../interfaces/app/appNotification';

export class AppNotificationModel extends Model<
    AppNotification,
    AppNotificationCreation
> {
    public id!: number;
    public userId!: number;
    public type!: number;
    public params!: object;
    public read!: boolean;
    public isWallet!: boolean;
    public isWebApp!: boolean;

    // timestamps!
    public readonly createdAt!: Date;
}

export function initializeAppNotification(sequelize: Sequelize): void {
    AppNotificationModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: sequelize.models.AppUserModel,
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            type: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            params: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            read: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            isWallet: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            isWebApp: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'app_notification',
            sequelize,
            updatedAt: false,
        }
    );
}
