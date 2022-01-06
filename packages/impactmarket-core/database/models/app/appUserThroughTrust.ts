import {
    AppUserThroughTrust,
    AppUserThroughTrustCreation,
} from '../../../interfaces/app/appUserThroughTrust';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppUserThroughTrustModel extends Model<
    AppUserThroughTrust,
    AppUserThroughTrustCreation
> {
    public userAddress!: string;
    public appUserTrustId!: string;
}

export function initializeAppUserThroughTrust(sequelize: Sequelize): void {
    AppUserThroughTrustModel.init(
        {
            userAddress: {
                type: DataTypes.STRING(44),
                references: {
                    model: 'app_user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            appUserTrustId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'app_user_trust',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
        },
        {
            tableName: 'app_user_through_trust',
            timestamps: false,
            sequelize,
        }
    );
}
