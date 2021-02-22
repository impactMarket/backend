import {
    StoryEngagement,
    StoryEngagementCreation,
} from '@interfaces/stories/storyEngagement';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class StoryEngagementModel extends Model<
    StoryEngagement,
    StoryEngagementCreation
> {
    public id!: number;
    public contentId!: number;
    public love!: number;
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
                    model: 'StoryContent',
                    key: 'id',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            love: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        },
        {
            tableName: 'StoryEngagement',
            sequelize,
            timestamps: false,
        }
    );
    return StoryEngagementModel;
}
