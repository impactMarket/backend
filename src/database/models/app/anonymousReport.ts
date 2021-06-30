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
    public category!: 'general' | 'potential-fraud';
    public status!: 'pending' | 'in-progress' | 'halted' | 'closed';
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
            category: {
                type: DataTypes.ENUM('general', 'potential-fraud'),
                allowNull: false,
                defaultValue: 'general',
            },
            status: {
                type: DataTypes.ENUM(
                    'pending',
                    'in-progress',
                    'halted',
                    'closed'
                ),
                allowNull: false,
                defaultValue: 'pending',
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
