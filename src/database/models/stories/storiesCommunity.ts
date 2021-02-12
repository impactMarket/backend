import {
    StoriesCommunity,
    StoriesCommunityCreation,
} from '@interfaces/stories/storiesCommunity';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class StoriesCommunityModel extends Model<
    StoriesCommunity,
    StoriesCommunityCreation
> {
    public id!: number;
    public contentId!: number;
    public communityId!: number;
    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeStoriesCommunity(
    sequelize: Sequelize
): typeof StoriesCommunityModel {
    StoriesCommunityModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            contentId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'storiesContent',
                    key: 'id',
                },
                allowNull: false,
            },
            communityId: {
                type: DataTypes.UUID,
                references: {
                    model: 'community',
                    key: 'publicId',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'StoriesCommunity',
            sequelize,
        }
    );
    return StoriesCommunityModel;
}
