import { Sequelize, DataTypes, Model } from 'sequelize';


export class CommunityDailyMetrics extends Model {
    public id!: number;
    public communityId!: string;
    public ssi!: number;
    public fundingRate!: number;
    public date!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeCommunityDailyMetrics(sequelize: Sequelize): void {
    return CommunityDailyMetrics.init({
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        communityId: {
            type: DataTypes.UUID,
            references: {
                model: 'community', // name of Target model
                key: 'publicId', // key in Target model that we're referencing
            },
            onDelete: 'RESTRICT',
            allowNull: false
        },
        ssi: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        fundingRate: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        }
    }, {
        tableName: 'communitydailymetrics',
        sequelize: sequelize, // this bit is important
    });
}