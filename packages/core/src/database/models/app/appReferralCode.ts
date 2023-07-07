import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppReferralCode, AppReferralCodeCreation } from '../../../interfaces/app/appReferralCode';
import { AppUserModel } from './appUser';
import { DbModels } from '../../../database/db';

export class AppReferralCodeModel extends Model<AppReferralCode, AppReferralCodeCreation> {
    public code!: string;
    public campaignId!: number;
    public userId!: number;

    public readonly user?: AppUserModel;
}

export function initializeAppReferralCode(sequelize: Sequelize): void {
    const { appUser } = sequelize.models as DbModels;
    AppReferralCodeModel.init(
        {
            code: {
                type: DataTypes.STRING(12),
                primaryKey: true,
                unique: true
            },
            campaignId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: appUser,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            }
        },
        {
            tableName: 'app_referral_code',
            modelName: 'appReferralCode',
            timestamps: false,
            sequelize
        }
    );
}
