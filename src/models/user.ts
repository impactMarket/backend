import { Sequelize, DataTypes, Model } from 'sequelize';


export class User extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public address!: string;
    public username!: string;
    public currency!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeUser(sequelize: Sequelize) {
    return User.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        address: {
            type: DataTypes.STRING(44),
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(64),
            // allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(4),
            // allowNull: false,
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
        tableName: 'user',
        sequelize: sequelize, // this bit is important
    });
}