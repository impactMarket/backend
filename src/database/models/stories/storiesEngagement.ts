import {
    StoriesEngagement,
    StoriesEngagementCreation,
} from '@interfaces/stories/storiesEngagement';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class StoriesEngagementModel extends Model<
    StoriesEngagement,
    StoriesEngagementCreation
> {
    public contentId!: number;
    public likes!: number;
    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeStoriesEngagement(
    sequelize: Sequelize
): typeof StoriesEngagementModel {
    StoriesEngagementModel.init(
        {
            contentId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'storiesContent',
                    key: 'id',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            likes: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
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
            tableName: 'StoriesEngagement',
            sequelize,
        }
    );
    return StoriesEngagementModel;
}
