import {
    StoryUserEngagement,
    StoryUserEngagementCreation,
} from '@interfaces/story/storyUserEngagement';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class StoryUserEngagementModel extends Model<
    StoryUserEngagement,
    StoryUserEngagementCreation
> {
    public id!: number;
    public contentId!: number;
    public address!: number;
}

export function initializeStoryUserEngagement(
    sequelize: Sequelize
): typeof StoryUserEngagementModel {
    StoryUserEngagementModel.init(
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
            address: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
        },
        {
            tableName: 'story_user_engagement',
            sequelize,
            timestamps: false,
        }
    );
    return StoryUserEngagementModel;
}
