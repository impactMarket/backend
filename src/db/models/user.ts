import { Sequelize, DataTypes, Model } from 'sequelize';

export interface UserAttributes {
    address: string;
    username: string | null;
    language: string;
    currency: string;
    pushNotificationToken: string | null;
    gender: string | null;
    year: number | null;
    children: number | null;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
export interface UserCreationAttributes {
    address: string;
    language: string;
    currency?: string;
    pushNotificationToken: string;
}

export class User extends Model<UserAttributes, UserCreationAttributes> {
    public address!: string;
    public username!: string | null;
    public avatar!: string;
    public language!: string;
    public currency!: string;
    public pushNotificationToken!: string | null;
    public gender!: string | null;
    public year!: number | null;
    public children!: number | null;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeUser(sequelize: Sequelize): void {
    User.init(
        {
            address: {
                type: DataTypes.STRING(44),
                allowNull: false,
                primaryKey: true,
                unique: true,
            },
            username: {
                type: DataTypes.STRING(128),
            },
            language: {
                type: DataTypes.STRING(8),
                allowNull: false,
            },
            currency: {
                type: DataTypes.STRING(4),
            },
            pushNotificationToken: {
                type: DataTypes.STRING(64),
            },
            gender: {
                type: DataTypes.STRING(2),
            },
            year: {
                type: DataTypes.INTEGER,
            },
            children: {
                type: DataTypes.INTEGER,
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
            tableName: 'user',
            sequelize,
        }
    );
}
