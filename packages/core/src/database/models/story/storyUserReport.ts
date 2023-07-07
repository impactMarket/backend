import { DataTypes, Model, Sequelize } from 'sequelize';

import { StoryUserReport, StoryUserReportCreation } from '../../../interfaces/story/storyUserReport';

export class StoryUserReportModel extends Model<StoryUserReport, StoryUserReportCreation> {
    public id!: number;
    public contentId!: number;
    public address!: number;
    public typeId!: number | null;
}

export function initializeStoryUserReport(sequelize: Sequelize): typeof StoryUserReportModel {
    StoryUserReportModel.init(
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
            address: {
                type: DataTypes.STRING(44),
                allowNull: false
            },
            typeId: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            tableName: 'story_user_report',
            modelName: 'storyUserReport',
            sequelize,
            timestamps: false
        }
    );
    return StoryUserReportModel;
}
