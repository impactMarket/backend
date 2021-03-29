import {
    UbiOrganization,
    UbiOrganizationCreation,
} from '@interfaces/ubi/ubiOrganization';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiOrganizationModel extends Model<
    UbiOrganization,
    UbiOrganizationCreation
> {
    public communityId!: string;
    public name!: string;
    public description!: string;
    public logo!: string;
    public website!: string;
    public facebook!: string;
}

export function initializeUbiOrganization(sequelize: Sequelize): void {
    UbiOrganizationModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                unique: true,
            },
            name: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING(512),
                allowNull: false,
            },
            logo: {
                type: DataTypes.STRING(128),
                allowNull: false,
            },
            website: {
                type: DataTypes.STRING(128),
                allowNull: false,
            },
            facebook: {
                type: DataTypes.STRING(128),
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_organization',
            timestamps: false,
            sequelize,
        }
    );
}
