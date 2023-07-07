import { DataTypes, Model, Sequelize } from 'sequelize';

import {
    UbiCommunityDailyMetrics,
    UbiCommunityDailyMetricsCreation
} from '../../../interfaces/ubi/ubiCommunityDailyMetrics';

export class UbiCommunityDailyMetricsModel extends Model<UbiCommunityDailyMetrics, UbiCommunityDailyMetricsCreation> {
    public id!: number;
    public communityId!: number;
    public ssiDayAlone!: number;
    public ssi!: number;
    public ubiRate!: number;
    public estimatedDuration!: number;
    public date!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeUbiCommunityDailyMetrics(sequelize: Sequelize): void {
    UbiCommunityDailyMetricsModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'community', // name of Target model
                    key: 'id' // key in Target model that we're referencing
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            ssiDayAlone: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            ssi: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            ubiRate: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            estimatedDuration: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'ubi_community_daily_metrics',
            modelName: 'ubiCommunityDailyMetrics',
            sequelize // this bit is important
        }
    );
}
