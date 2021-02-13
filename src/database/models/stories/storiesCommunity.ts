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
                    model: 'StoriesContent',
                    key: 'id',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
        },
        {
            tableName: 'StoriesCommunity',
            sequelize,
            timestamps: false,
        }
    );
    return StoriesCommunityModel;
}
