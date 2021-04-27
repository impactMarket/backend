import {
    UbiOrganizationSocialMedia,
    UbiOrganizationSocialMediaCreation,
} from '@interfaces/ubi/ubiOrganizationSocialMedia';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiOrganizationSocialMediaModel extends Model<
    UbiOrganizationSocialMedia,
    UbiOrganizationSocialMediaCreation
> {
    public id!: number;
    public organizationId!: string;
    public mediaType!: string;
    public url!: string;
}

export function initializeUbiOrganizationSocialMedia(
    sequelize: Sequelize
): void {
    UbiOrganizationSocialMediaModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            organizationId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'ubi_organization',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            mediaType: {
                type: DataTypes.STRING(32),
                allowNull: true,
            },
            url: {
                type: DataTypes.STRING(128),
                allowNull: true,
            },
        },
        {
            tableName: 'ubi_organization_social_media',
            timestamps: false,
            sequelize,
        }
    );
}
