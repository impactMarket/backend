import { Sequelize, DataTypes, Model } from 'sequelize';


export class User extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public address!: string;
    public username!: string;
    public avatar!: string;
    public language!: string;
    public currency!: string;
    public authToken!: string;
    public pushNotificationToken!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeUser(sequelize: Sequelize): void {
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
        pin: {
            type: DataTypes.STRING(129),
            allowNull: false,
            get() {
                return undefined;
            }
        },
        username: {
            type: DataTypes.STRING(64),
        },
        avatar: {
            type: DataTypes.STRING(128),
        },
        language: {
            type: DataTypes.STRING(8),
        },
        currency: {
            type: DataTypes.STRING(4),
        },
        authToken: {
            type: DataTypes.STRING(180),
        },
        pushNotificationToken: {
            type: DataTypes.STRING(64),
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