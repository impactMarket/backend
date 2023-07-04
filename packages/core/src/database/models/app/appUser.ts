import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    AppUser,
    AppUserCreationAttributes,
} from '../../../interfaces/app/appUser';
import { MicroCreditBorrowersModel } from '../microCredit/borrowers';

export class AppUserModel extends Model<AppUser, AppUserCreationAttributes> {
    public id!: number;
    public address!: string;
    public firstName!: string | null;
    public lastName!: string | null;
    public avatarMediaPath!: string | null;
    public language!: string;
    public currency!: string;
    public walletPNT!: string | null;
    public appPNT!: string | null;
    public gender!: string;
    public year!: number | null;
    public children!: number | null;
    public lastLogin!: Date;
    public active!: boolean;
    public email!: string;
    public emailValidated!: boolean;
    public bio!: string;
    public country!: string;
    public phone!: string;
    public phoneValidated!: boolean;
    public readBeneficiaryRules!: boolean;
    public readManagerRules!: boolean;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;

    public readonly borrower?: MicroCreditBorrowersModel;
}

export function initializeAppUser(sequelize: Sequelize): typeof AppUserModel {
    AppUserModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
            },
            address: {
                type: DataTypes.STRING(44),
                allowNull: false,
                primaryKey: true, // TODO: remove and set "id" as the primary key
            },
            avatarMediaPath: {
                type: DataTypes.STRING(44),
                allowNull: true,
            },
            firstName: {
                type: DataTypes.STRING(128),
            },
            lastName: {
                type: DataTypes.STRING(128),
            },
            language: {
                type: DataTypes.STRING(8),
                defaultValue: 'en',
                allowNull: false,
            },
            currency: {
                type: DataTypes.STRING(4),
            },
            walletPNT: {
                type: DataTypes.STRING(256),
            },
            appPNT: {
                type: DataTypes.STRING(256),
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
            email: {
                type: DataTypes.STRING(64),
            },
            emailValidated: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            bio: {
                type: DataTypes.STRING(64),
            },
            country: {
                type: DataTypes.STRING(64),
            },
            phone: {
                type: DataTypes.STRING(64),
            },
            phoneValidated: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            lastLogin: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.fn('now'),
                allowNull: false,
            },
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            readBeneficiaryRules: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            readManagerRules: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
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
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: 'app_user',
            modelName: 'appUser',
            sequelize,
        }
    );
    return AppUserModel;
}
