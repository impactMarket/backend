import { Sequelize, DataTypes, Model } from 'sequelize';

export class CommunityDailyMetrics extends Model {
    public id!: number;
    public communityId!: string;
    public ssiDayAlone!: number;
    public ssi!: number;
    public ubiRate!: number;
    public estimatedDuration!: number;
    public date!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeCommunityDailyMetrics(sequelize: Sequelize): void {
    return CommunityDailyMetrics.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: DataTypes.UUID,
                references: {
                    model: 'community', // name of Target model
                    key: 'publicId', // key in Target model that we're referencing
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            ssiDayAlone: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            ssi: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            ubiRate: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            estimatedDuration: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'communitydailymetrics',
            sequelize, // this bit is important
        }
    );
}
