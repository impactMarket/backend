import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    StoryCommunity,
    StoryCommunityCreation,
} from '../../../interfaces/story/storyCommunity';

export class StoryCommunityModel extends Model<
    StoryCommunity,
    StoryCommunityCreation
> {
    public id!: number;
    public contentId!: number;
    public communityId!: number;
}

export function initializeStoryCommunity(
    sequelize: Sequelize
): typeof StoryCommunityModel {
    StoryCommunityModel.init(
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
                    model: 'story_content',
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
                onDelete: 'RESTRICT',
                allowNull: false,
            },
        },
        {
            tableName: 'story_community',
            sequelize,
            timestamps: false,
        }
    );
    return StoryCommunityModel;
}
