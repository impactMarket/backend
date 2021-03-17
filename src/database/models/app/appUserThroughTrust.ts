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
    public appUserTrustPhone!: string;
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
            appUserTrustPhone: {
                type: DataTypes.STRING(64),
                // references: {
                //     model: 'AppUserTrust',
                //     key: 'phone',
                // },
                // onDelete: 'CASCADE',
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
