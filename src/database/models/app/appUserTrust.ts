import {
    AppUserTrust,
    AppUserTrustCreation,
} from '@interfaces/app/appUserTrust';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppUserTrustModel extends Model<
    AppUserTrust,
    AppUserTrustCreation
> {
    public id!: number;
    public phone!: string;
    public verifiedPhoneNumber!: boolean;
    public suspect!: boolean;
}

export function initializeAppUserTrust(sequelize: Sequelize): void {
    AppUserTrustModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            phone: {
                // hashed phone number
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            verifiedPhoneNumber: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            suspect: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: 'AppUserTrust',
            timestamps: false,
            sequelize,
        }
    );
}
