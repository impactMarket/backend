import { Sequelize, DataTypes, Model } from 'sequelize';

export enum AssetType {
    cUSD,
    cEUR,
    CELO,
}

interface InflowAttributes {
    id: number;
    from: string;
    contractAddress: string;
    amount: string;
    tx: string;
    txAt: Date;
    value: string;
    asset?: AssetType;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
export interface InflowCreationAttributes {
    from: string;
    contractAddress: string;
    amount: string;
    value: string;
    asset?: AssetType;
    tx: string;
    txAt: Date;
}
export class Inflow extends Model<InflowAttributes, InflowCreationAttributes> {
    public id!: number;
    public from!: string;
    public contractAddress!: string;
    public amount!: string;
    public value!: string;
    public asset!: number;
    public tx!: string;
    public txAt!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeInflow(sequelize: Sequelize): void {
    Inflow.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            from: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            contractAddress: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            amount: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 9,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            tx: {
                type: DataTypes.STRING(68),
                unique: true,
                allowNull: false,
            },
            txAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            asset: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            value: {
                type: DataTypes.DECIMAL(29), // max 9,999,999,999 - plus 18 decimals
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
            tableName: 'inflow',
            sequelize,
        }
    );
}
