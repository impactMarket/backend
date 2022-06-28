import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    StoryMedia,
    StoryMediaCreation,
} from '../../../interfaces/story/storyMedia';

export class StoryMediaModel extends Model<
    StoryMedia,
    StoryMediaCreation
> {
    public id!: number;
    public contentId!: number;
    public communityId!: number;
}

export function initializeStoryMedia(
    sequelize: Sequelize
): typeof StoryMediaModel {
    StoryMediaModel.init(
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
            storyMediaPath: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: 'story_media',
            sequelize,
            timestamps: false,
        }
    );
    return StoryMediaModel;
}
