import { User } from '@interfaces/app/user';
import { Sequelize, DataTypes, Model } from 'sequelize';

import { CommunityAttributes } from './community';

export interface ManagerAttributes {
    id: number;
    address: string;
    communityId: string;
    active: boolean;
    readRules: boolean;

    // timestamps
    createdAt: Date;
    updatedAt: Date;

    user?: User;
    community?: CommunityAttributes;
}
export interface ManagerCreationAttributes {
    address: string;
    communityId: string;
}
export class Manager extends Model<
    ManagerAttributes,
    ManagerCreationAttributes
> {
    public id!: number;
    public address!: string;
    public communityId!: string;
    public active!: boolean;
    public readRules!: boolean;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeManager(sequelize: Sequelize): void {
    Manager.init(
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
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            communityId: {
                type: DataTypes.UUID,
                references: {
                    model: 'community',
                    key: 'publicId',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            readRules: {
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
            tableName: 'manager',
            sequelize,
        }
    );
}
