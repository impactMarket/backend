import { Sequelize, DataTypes, Model } from 'sequelize';

export interface MerchantRegistry {
    id: number;
    name: string;
    street: string;
    city: string;
    country: string;
    gps: {
        latitude: number;
        longitude: number;
    };
    cashout: boolean;
    payment: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MerchantRegistryCreationAttributes {
    name: string;
    street: string;
    city: string;
    country: string;
    gps: {
        latitude: number;
        longitude: number;
    };
    cashout: boolean;
    payment: boolean;
}

export class MerchantRegistryModel extends Model<
    MerchantRegistry,
    MerchantRegistryCreationAttributes
> {
    public id!: number;
    public name!: string;
    public street!: string;
    public city!: string;
    public country!: string;
    public gps!: {
        latitude: number;
        longitude: number;
    };
    public cashout!: boolean;
    public payment!: boolean;

    // timestamps!
    public createdAt!: Date;
    public updatedAt!: Date;
}

export function initializeMerchantRegistry(
    sequelize: Sequelize
): typeof MerchantRegistryModel {
    MerchantRegistryModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            street: {
                type: DataTypes.STRING(128),
                allowNull: false,
            },
            city: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            country: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            gps: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            cashout: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            payment: {
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
            tableName: 'merchant_registry',
            sequelize,
        }
    );
    return MerchantRegistryModel;
}
