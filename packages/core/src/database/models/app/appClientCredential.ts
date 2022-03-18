import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    AppClientCredential,
    AppClientCredentialCreationAttributes,
} from '../../../interfaces/app/appClientCredential';

export class AppClientCredentialModel extends Model<
    AppClientCredential,
    AppClientCredentialCreationAttributes
> {
    public id!: number;
    public name!: string;
    public clientId!: string;
    public clientSecret!: string;
    public status!: 'active' | 'inactive';

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeAppClientCredential(
    sequelize: Sequelize
): typeof AppClientCredentialModel {
    AppClientCredentialModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },
            clientId: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            clientSecret: {
                type: DataTypes.STRING(256),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('active', 'inactive'),
                allowNull: false,
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
            tableName: 'app_client_credential',
            sequelize,
        }
    );
    return AppClientCredentialModel;
}
