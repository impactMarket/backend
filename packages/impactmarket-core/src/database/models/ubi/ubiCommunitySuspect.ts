import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    UbiCommunitySuspect,
    UbiCommunitySuspectCreation,
} from '../../../interfaces/ubi/ubiCommunitySuspect';

export class UbiCommunitySuspectModel extends Model<
    UbiCommunitySuspect,
    UbiCommunitySuspectCreation
> {
    public id!: number;
    public communityId!: number;
    public percentage!: number;
    public suspect!: number;
    public createdAt!: Date;
}

export function initializeUbiCommunitySuspect(sequelize: Sequelize): void {
    UbiCommunitySuspectModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            percentage: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            suspect: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATEONLY,
                defaultValue: Sequelize.fn('now'),
            },
        },
        {
            tableName: 'ubi_community_suspect',
            timestamps: false,
            sequelize,
        }
    );
}
