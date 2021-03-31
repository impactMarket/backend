import {
    AppAnonymousReport,
    AppAnonymousReportCreation,
} from '@interfaces/app/appAnonymousReport';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppAnonymousReportModel extends Model<
    AppAnonymousReport,
    AppAnonymousReportCreation
> {
    public id!: number;
    public communityId!: string;
    public message!: string;
    public createdAt!: Date;
}

export function initializeAppAnonymousReport(sequelize: Sequelize): void {
    AppAnonymousReportModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: DataTypes.UUID,
                references: {
                    model: 'community',
                    key: 'publicId',
                },
                onDelete: 'RESTRICT',
                allowNull: true,
            },
            message: {
                type: DataTypes.STRING(512),
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATEONLY,
                defaultValue: Sequelize.fn('now'),
            },
        },
        {
            tableName: 'app_anonymous_report',
            timestamps: false,
            sequelize,
        }
    );
}
