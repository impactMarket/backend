import {
    StoriesContent,
    StoriesContentCreation,
} from '@interfaces/stories/storiesContent';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class StoriesContentModel extends Model<
    StoriesContent,
    StoriesContentCreation
> {
    public id!: number;
    public media!: string;
    public message!: string;
    public byAddress!: string;
    public isPublic!: boolean;
    public postedAt!: Date;
}

export function initializeStoriesContent(
    sequelize: Sequelize
): typeof StoriesContentModel {
    StoriesContentModel.init(
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
            tableName: 'StoriesContent',
            sequelize,
            timestamps: false,
        }
    );
    return StoriesContentModel;
}
