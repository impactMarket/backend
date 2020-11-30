import { Sequelize, DataTypes, Model, BuildOptions } from 'sequelize';

export interface UserAttributes {
    address: string;
    username: string;
    avatar: string;
    language: string;
    currency: string;
    pushNotificationToken: string;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
};
export interface UserCreationAttributes {
    address: string;
    avatar: string;
    language: string;
    pushNotificationToken: string;
};

// export interface UserModel extends Model<UserAttributes>, UserAttributes { }

export type UserModel = Model<UserAttributes>;

export class User extends Model<UserAttributes, UserCreationAttributes> {
    public address!: string;
    public username!: string;
    public avatar!: string;
    public language!: string;
    public currency!: string;
    public pushNotificationToken!: string;

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
            avatar: {
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
            sequelize, // this bit is important
        }
    );
}
