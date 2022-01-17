import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    AppMediaContent,
    AppMediaContentCreation,
} from '../../../interfaces/app/appMediaContent';

export class AppMediaContentModel extends Model<
    AppMediaContent,
    AppMediaContentCreation
> {
    public id!: number;
    public url!: string;
    public width!: number;
    public height!: number;
}

export function initializeAppMediaContent(sequelize: Sequelize): void {
    AppMediaContentModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
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
        },
        {
            tableName: 'app_media_content',
            timestamps: false,
            sequelize,
        }
    );
}
