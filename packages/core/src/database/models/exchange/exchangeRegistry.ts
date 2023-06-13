import { Sequelize, DataTypes, Model } from 'sequelize';

export interface ExchangeRegistry {
    id: number;
    name: string;
    description: string;
    logoUrl: string | null;
    website: string | null;
    countries: string[];
    global: boolean;
    customImplementation: string | null;
    iframeUrl: string | null;
    fee: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExchangeRegistryCreationAttributes {
    name: string;
    description: string;
    logoUrl: string | null;
    website: string | null;
    countries: string[];
    global: boolean;
    customImplementation?: string;
    iframeUrl?: string;
    fee?: number;
}

export class ExchangeRegistryModel extends Model<
    ExchangeRegistry,
    ExchangeRegistryCreationAttributes
> {
    public id!: number;
    public name!: string;
    public description!: string;
    public logoUrl!: string | null;
    public website!: string | null;
    public countries!: string[];
    public global!: boolean;
    public customImplementation!: string | null;
    public iframeUrl!: string | null;
    public fee!: number | null;

    // timestamps!
    public createdAt!: Date;
    public updatedAt!: Date;
}

export function initializeExchangeRegistry(
    sequelize: Sequelize
): typeof ExchangeRegistryModel {
    ExchangeRegistryModel.init(
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
            description: {
                type: DataTypes.STRING(256),
                allowNull: false,
            },
            logoUrl: {
                type: DataTypes.STRING(256),
                allowNull: true,
            },
            website: {
                type: DataTypes.STRING(128),
                allowNull: true,
            },
            countries: {
                type: DataTypes.ARRAY(DataTypes.STRING(2)),
                allowNull: true,
            },
            global: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            customImplementation: {
                type: DataTypes.STRING(16),
                allowNull: true,
            },
            iframeUrl: {
                type: DataTypes.STRING(256),
                allowNull: true,
            },
            fee: {
                type: DataTypes.FLOAT,
                allowNull: true,
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
            tableName: 'exchange_registry',
            modelName: 'exchangeRegistry',
            sequelize,
        }
    );
    return ExchangeRegistryModel;
}
