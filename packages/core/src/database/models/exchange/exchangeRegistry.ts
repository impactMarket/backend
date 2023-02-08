import { Sequelize, DataTypes, Model } from 'sequelize';

export interface ExchangeRegistry {
    id: number;
    name: string;
    countries: [string];
    global: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExchangeRegistryCreationAttributes {
    name: string;
    global: boolean;
    countries: [string];
}

export class ExchangeRegistryModel extends Model<
    ExchangeRegistry,
    ExchangeRegistryCreationAttributes
> {
    public id!: number;
    public name!: string;
    public countries!: [string];
    public global!: boolean;

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
            global: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            countries: {
                type: DataTypes.ARRAY(DataTypes.STRING(2)),
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
            sequelize,
        }
    );
    return ExchangeRegistryModel;
}
