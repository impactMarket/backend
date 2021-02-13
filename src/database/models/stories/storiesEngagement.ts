import {
    StoriesEngagement,
    StoriesEngagementCreation,
} from '@interfaces/stories/storiesEngagement';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class StoriesEngagementModel extends Model<
    StoriesEngagement,
    StoriesEngagementCreation
> {
    public id!: number;
    public contentId!: number;
    public likes!: number;
}

export function initializeStoriesEngagement(
    sequelize: Sequelize
): typeof StoriesEngagementModel {
    StoriesEngagementModel.init(
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
            likes: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        },
        {
            tableName: 'StoriesEngagement',
            sequelize,
            timestamps: false,
        }
    );
    return StoriesEngagementModel;
}
