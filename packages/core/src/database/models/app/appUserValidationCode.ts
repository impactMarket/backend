import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    AppUserValidationCode,
    AppUserValidationCodeCreation,
} from '../../../interfaces/app/appUserValidationCode';
import { DbModels } from '../../../database/db';

export class AppUserValidationCodeModel extends Model<
    AppUserValidationCode,
    AppUserValidationCodeCreation
> {
    public id!: number;
    public userId!: number;
    public type!: number;
    public code!: string;
    public expiresAt!: Date;
}

export function initializeAppUserValidationCode(sequelize: Sequelize): void {
    const { appUser } = sequelize.models as DbModels;
    AppUserValidationCodeModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: appUser,
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            type: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING(9),
                allowNull: false,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'app_user_validation_code',
            modelName: 'appUserValidationCode',
            sequelize,
            updatedAt: false,
            createdAt: false,
        }
    );
}
