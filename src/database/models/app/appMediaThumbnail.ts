import {
    AppMediaThumbnail,
    AppMediaThumbnailCreation,
} from '@interfaces/app/appMediaThumbnail';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppMediaThumbnailModel extends Model<
    AppMediaThumbnail,
    AppMediaThumbnailCreation
> {
    public id!: number;
    public mediaContentId!: number;
    public url!: string;
    public width!: number;
    public height!: number;
    public pixelRatio!: number;
}

export function initializeAppMediaThumbnail(sequelize: Sequelize): void {
    AppMediaThumbnailModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            mediaContentId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'app_media_content',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            url: {
                type: DataTypes.STRING(128),
                allowNull: false,
            },
            width: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            height: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            pixelRatio: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: 'app_media_thumbnail',
            timestamps: false,
            sequelize,
        }
    );
}
