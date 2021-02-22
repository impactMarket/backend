import {
    StoryContent,
    StoryContentCreation,
} from '@interfaces/stories/storyContent';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class StoryContentModel extends Model<
    StoryContent,
    StoryContentCreation
> {
    public id!: number;
    public media!: string;
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
            media: {
                type: DataTypes.STRING(128),
                allowNull: true,
            },
            message: {
                type: DataTypes.STRING(256),
                allowNull: true,
            },
            byAddress: {
                type: DataTypes.STRING(44),
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
            tableName: 'StoryContent',
            sequelize,
            timestamps: false,
        }
    );
    return StoryContentModel;
}
