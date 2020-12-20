import { Sequelize, DataTypes, Model } from 'sequelize';

export interface UserAttributes {
    address: string;
    username: string | null;
    language: string;
    currency: string;
    pushNotificationToken: string | null;
    gender: string | null;
    age: number | null;
    childs: number | null;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
};
interface UserCreationAttributes {
    address: string;
    language: string;
    pushNotificationToken: string;
};

export class User extends Model<UserAttributes, UserCreationAttributes> {
    public address!: string;
    public username!: string | null;
    public avatar!: string;
    public language!: string;
    public currency!: string;
    public pushNotificationToken!: string | null;
    public gender!: string | null;
    public age!: number | null;
    public childs!: number | null;

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
            age: {
                type: DataTypes.INTEGER,
            },
            childs: {
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
            sequelize
        }
    );
}
