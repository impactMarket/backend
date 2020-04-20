import { Sequelize, DataTypes, Model } from 'sequelize';


export class Transactions extends Model {
    public tx!: string; // Note that the `null assertion` `!` is required in strict mode.
    public type!: number;
    public from!: string;
    public to!: string;
    public amount!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


export function initializeTransactions(sequelize: Sequelize)  {
    return Transactions.init({
        tx: {
            type: new DataTypes.STRING(68),
            // primaryKey: true,
            unique: true
        },
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        from: {
            type: new DataTypes.STRING(44),
            allowNull: false
        },
        to: {
            type: new DataTypes.STRING(44),
            allowNull: false
        },
        amount: {
            type: new DataTypes.STRING(64),
            allowNull: false
        }
    }, {
        tableName: 'transactions',
        sequelize: sequelize, // this bit is important
    });
}