import { Sequelize, DataTypes, Model } from 'sequelize';


export class ExchangeRates extends Model {
    public currency!: string;
    public rate!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeExchangeRates(sequelize: Sequelize): void {
    return ExchangeRates.init({
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
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        }
    }, {
        tableName: 'exchangerates',
        sequelize: sequelize, // this bit is important
    });
}