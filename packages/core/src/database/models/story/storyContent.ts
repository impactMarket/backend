import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    StoryContent,
    StoryContentCreation,
} from '../../../interfaces/story/storyContent';

export class StoryContentModel extends Model<
    StoryContent,
    StoryContentCreation
> {
    public id!: number;
    public mediaMediaId!: number;
    public message!: string;
    public byAddress!: string;
    public isPublic!: boolean;
    public postedAt!: Date;
}

export function initializeStoryContent(
    sequelize: Sequelize
): typeof StoryContentModel {
    StoryContentModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            mediaMediaId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'app_media_content',
                    key: 'id',
                },
                // onDelete: 'SET NULL', // default
                allowNull: true,
            },
            message: {
                type: DataTypes.STRING(256),
                allowNull: true,
            },
            byAddress: {
                type: DataTypes.STRING(44),
                references: {
                    model: 'app_user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            isPublic: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            postedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'story_content',
            sequelize,
            timestamps: false,
        }
    );
    return StoryContentModel;
}
