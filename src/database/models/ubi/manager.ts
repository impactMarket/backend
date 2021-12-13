import { AppUser } from '@interfaces/app/appUser';
import { CommunityAttributes } from '@interfaces/ubi/community';
import { UbiBeneficiaryRegistry } from '@interfaces/ubi/ubiBeneficiaryRegistry';
import { Sequelize, DataTypes, Model } from 'sequelize';

export interface ManagerAttributes {
    id: number;
    address: string;
    communityId: number;
    active: boolean;
    readRules: boolean;
    blocked: boolean;

    // timestamps
    createdAt: Date;
    updatedAt: Date;

    user?: AppUser;
    community?: CommunityAttributes;
    addedBeneficiaries?: UbiBeneficiaryRegistry[];
}
export interface ManagerCreationAttributes {
    address: string;
    communityId: number;
}
export class Manager extends Model<
    ManagerAttributes,
    ManagerCreationAttributes
> {
    public id!: number;
    public address!: string;
    public communityId!: number;
    public active!: boolean;
    public readRules!: boolean;
    public blocked!: boolean;

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
                    model: sequelize.models.AppUserModel,
                    key: 'address',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            communityId: {
                type: DataTypes.INTEGER,
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
            blocked: {
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
