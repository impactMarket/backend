import { Sequelize, DataTypes, Model } from 'sequelize';

export interface ExchangeRatesAttributes {
    currency: string;
    rate: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
interface ExchangeRatesCreationAttributes {
    currency: string;
    rate: number;
}
export class ExchangeRates extends Model<
    ExchangeRatesAttributes,
    ExchangeRatesCreationAttributes
> {
    public currency!: string;
    public rate!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeExchangeRates(sequelize: Sequelize): void {
    ExchangeRates.init(
        {
            currency: {
                type: DataTypes.STRING(5),
                primaryKey: true,
                unique: true,
                allowNull: false,
            },
            rate: {
                type: DataTypes.FLOAT,
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
            tableName: 'exchangerates',
            sequelize,
        }
    );
}
