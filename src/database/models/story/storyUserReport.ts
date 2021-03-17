import {
    StoryUserReport,
    StoryUserReportCreation,
} from '@interfaces/story/storyUserReport';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class StoryUserReportModel extends Model<
    StoryUserReport,
    StoryUserReportCreation
> {
    public id!: number;
    public contentId!: number;
    public address!: number;
}

export function initializeStoryUserReport(
    sequelize: Sequelize
): typeof StoryUserReportModel {
    StoryUserReportModel.init(
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
                onDelete: 'CASCADE',
                allowNull: false,
            },
            address: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
        },
        {
            tableName: 'StoryUserReport',
            sequelize,
            timestamps: false,
        }
    );
    return StoryUserReportModel;
}
