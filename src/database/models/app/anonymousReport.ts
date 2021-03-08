import {
    AppAnonymousReport,
    AppAnonymousReportCreation,
} from '@interfaces/appAnonymousReport';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppAnonymousReportModel extends Model<
    AppAnonymousReport,
    AppAnonymousReportCreation
> {
    public id!: number;
    public communityId!: string;
    public message!: string;
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
        },
        {
            tableName: 'AppAnonymousReport',
            timestamps: false,
            sequelize,
        }
    );
}
