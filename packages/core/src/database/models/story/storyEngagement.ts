import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    StoryEngagement,
    StoryEngagementCreation,
} from '../../../interfaces/story/storyEngagement';

export class StoryEngagementModel extends Model<
    StoryEngagement,
    StoryEngagementCreation
> {
    public id!: number;
    public contentId!: number;
    public loves!: number;
}

export function initializeStoryEngagement(
    sequelize: Sequelize
): typeof StoryEngagementModel {
    StoryEngagementModel.init(
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
            loves: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        },
        {
            tableName: 'story_engagement',
            sequelize,
            timestamps: false,
        }
    );
    return StoryEngagementModel;
}
