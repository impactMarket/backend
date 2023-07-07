import { DataTypes, Model, Sequelize } from 'sequelize';

import { StoryComment, StoryCommentCreation } from '../../../interfaces/story/storyComment';

export class StoryCommentModel extends Model<StoryComment, StoryCommentCreation> {
    public id!: number;
    public contentId!: number;
    public comment!: string;
    public userId!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeStoryComment(sequelize: Sequelize): typeof StoryCommentModel {
    StoryCommentModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            contentId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'story_content',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            comment: {
                type: DataTypes.STRING(256),
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'story_comment',
            modelName: 'storyComment',
            sequelize
        }
    );
    return StoryCommentModel;
}
