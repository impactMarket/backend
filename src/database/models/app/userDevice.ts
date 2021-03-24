import {
    AppUserDevice,
    AppUserDeviceCreation,
} from '@interfaces/appUserDevice';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppUserDeviceModel extends Model<
    AppUserDevice,
    AppUserDeviceCreation
> {
    public id!: number;
    public userAddress!: string;
    public phone!: string;
    public identifier!: string;
    public device!: string;
    public network!: string;
    public lastLogin!: Date;
}

export function initializeAppUserDevice(sequelize: Sequelize): void {
    AppUserDeviceModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userAddress: {
                type: DataTypes.STRING(44),
                references: {
                    model: 'user',
                    key: 'address',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            identifier: {
                type: DataTypes.STRING(256),
                allowNull: false,
            },
            device: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            network: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            lastLogin: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'app_user_device',
            timestamps: false,
            sequelize,
        }
    );
}
