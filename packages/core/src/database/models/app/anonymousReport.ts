import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppAnonymousReport, AppAnonymousReportCreation } from '../../../interfaces/app/appAnonymousReport';
import { DbModels } from '../../../database/db';

export class AppAnonymousReportModel extends Model<AppAnonymousReport, AppAnonymousReportCreation> {
    public id!: number;
    public communityId!: number;
    public message!: string;
    public category!: 'general' | 'potential-fraud';
    public review!: 'pending' | 'in-progress' | 'halted' | 'closed';
    public createdAt!: Date;
}

export function initializeAppAnonymousReport(sequelize: Sequelize): void {
    const { community } = sequelize.models as DbModels;
    AppAnonymousReportModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: community,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: true
            },
            message: {
                type: DataTypes.STRING(512),
                allowNull: false
            },
            category: {
                type: DataTypes.ENUM('general', 'potential-fraud'),
                allowNull: false,
                defaultValue: 'general'
            },
            review: {
                type: DataTypes.ENUM('pending', 'in-progress', 'halted', 'closed'),
                allowNull: false,
                defaultValue: 'pending'
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'app_anonymous_report',
            modelName: 'appAnonymousReport',
            updatedAt: false,
            sequelize
        }
    );
}
