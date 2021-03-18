import {
    AppUserThroughTrust,
    AppUserThroughTrustCreation,
} from '@interfaces/app/appUserThroughTrust';
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
                    model: 'user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            appUserTrustId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'AppUserTrust',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
        },
        {
            tableName: 'AppUserThroughTrust',
            timestamps: false,
            sequelize,
        }
    );
}
