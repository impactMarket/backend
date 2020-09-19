import { Sequelize, DataTypes, Model } from 'sequelize';


export class GlobalStatus extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public key!: string;
    public value!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeGlobalStatus(sequelize: Sequelize): void {
    return GlobalStatus.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        key: {
            type: DataTypes.STRING(32),
            allowNull: false
        },
        value: {
            type: DataTypes.STRING(64),
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
        tableName: 'globalstatus',
        sequelize: sequelize, // this bit is important
    });
}