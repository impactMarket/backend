import { User, UserCreationAttributes } from '@interfaces/app/user';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UserModel extends Model<User, UserCreationAttributes> {
    public address!: string;
    public username!: string | null;
    public avatar!: string;
    public language!: string;
    public currency!: string;
    public pushNotificationToken!: string | null;
    public gender!: string;
    public year!: number | null;
    public children!: number | null;
    public lastLogin!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeUser(sequelize: Sequelize): typeof UserModel {
    UserModel.init(
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
                defaultValue: 'u',
            },
            year: {
                type: DataTypes.INTEGER,
            },
            children: {
                type: DataTypes.INTEGER,
            },
            lastLogin: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.fn('now'),
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
            tableName: 'user',
            sequelize,
        }
    );
    return UserModel;
}
