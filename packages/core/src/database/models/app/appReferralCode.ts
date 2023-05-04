import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    AppReferralCode,
    AppReferralCodeCreation,
} from '../../../interfaces/app/appReferralCode';

export class AppReferralCodeModel extends Model<
    AppReferralCode,
    AppReferralCodeCreation
> {
    public id!: number;
    public code!: string;
    public campaignId!: number;
    public userId!: number;
}

export function initializeAppReferralCode(sequelize: Sequelize): void {
    AppReferralCodeModel.init(
        {
            code: {
                type: DataTypes.STRING(12),
                primaryKey: true,
                unique: true,
            },
            campaignId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: sequelize.models.AppUserModel,
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
        },
        {
            tableName: 'app_referral_code',
            timestamps: false,
            sequelize,
        }
    );
}
