import {
    UbiOrganization,
    UbiOrganizationCreation,
} from '@interfaces/ubi/ubiOrganization';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiOrganizationModel extends Model<
    UbiOrganization,
    UbiOrganizationCreation
> {
    public name!: string;
    public description!: string;
    public logoMediaId!: number;
}

export function initializeUbiOrganization(sequelize: Sequelize): void {
    UbiOrganizationModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING(512),
                allowNull: false,
            },
            logoMediaId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'app_media_content',
                    key: 'id',
                },
                // onDelete: 'SET NULL', // default
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
