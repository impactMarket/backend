import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AppExchangeRatesAttributes {
    currency: string;
    rate: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
interface AppExchangeRatesCreationAttributes {
    currency: string;
    rate: number;
}
export class AppExchangeRates extends Model<AppExchangeRatesAttributes, AppExchangeRatesCreationAttributes> {
    public currency!: string;
    public rate!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeAppExchangeRates(sequelize: Sequelize): void {
    AppExchangeRates.init(
        {
            currency: {
                type: DataTypes.STRING(5),
                primaryKey: true,
                unique: true,
                allowNull: false
            },
            rate: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'exchangerates',
            modelName: 'appExchangeRates',
            sequelize
        }
    );
}
