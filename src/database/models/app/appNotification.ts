import {
    AppNotification,
    AppNotificationCreation,
} from '@interfaces/app/appNotification';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppNotificationModel extends Model<
    AppNotification,
    AppNotificationCreation
> {
    public id!: number;
    public address!: string;
    public type!: number;
    public params!: {
        [key: string]: any;
    } | null;
    public read!: boolean;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeAppNotification(sequelize: Sequelize): void {
    AppNotificationModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: DataTypes.STRING(44),
                references: {
                    model: sequelize.models.UserModel,
                    key: 'address',
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
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'app_notification',
            sequelize,
        }
    );
}
