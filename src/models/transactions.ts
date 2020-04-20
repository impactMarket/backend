import { Sequelize, DataTypes, Model } from 'sequelize';


export class Transactions extends Model {
    public tx!: string; // Note that the `null assertion` `!` is required in strict mode.
    public from!: string;
    public event!: string;
    public values!: any;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeTransactions(sequelize: Sequelize)  {
    return Transactions.init({
        tx: {
            type: new DataTypes.STRING(68),
            primaryKey: true,
            unique: true
        },
        from: {
            type: new DataTypes.STRING(44),
            allowNull: false
        },
        event: {
            type: new DataTypes.STRING(64),
            allowNull: false
        },
        values: {
            type: DataTypes.JSONB,
            allowNull: false
        }
    }, {
        tableName: 'transactions',
        sequelize: sequelize, // this bit is important
    });
}