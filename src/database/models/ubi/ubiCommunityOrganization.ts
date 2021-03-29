import {
    UbiCommunityOrganization,
    UbiCommunityOrganizationCreation,
} from '@interfaces/ubi/ubiCommunityOrganization';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiCommunityOrganizationModel extends Model<
    UbiCommunityOrganization,
    UbiCommunityOrganizationCreation
> {
    public organizationId!: number;
    public communityId!: number;
}

export function initializeUbiCommunityOrganization(sequelize: Sequelize): void {
    UbiCommunityOrganizationModel.init(
        {
            organizationId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'ubi_organization',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_community_organization',
            timestamps: false,
            sequelize,
        }
    );
}
