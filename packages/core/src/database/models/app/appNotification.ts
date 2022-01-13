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
    public params!: string;
    public read!: boolean;

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
                type: DataTypes.STRING(32),
                allowNull: true,
            },
            read: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'app_notification',
            sequelize,
            timestamps: false,
        }
    );
}
