import { DataTypes, Model, Sequelize } from 'sequelize';

import { UbiClaimLocation, UbiClaimLocationCreation } from '../../../interfaces/ubi/ubiClaimLocation';

export class ClaimLocationModel extends Model<UbiClaimLocation, UbiClaimLocationCreation> {
    public id!: number;
    public communityId!: string;
    public gps!: {
        latitude: number;
        longitude: number;
    };

    // timestamps!
    public readonly createdAt!: Date;
}

export function initializeUbiClaimLocation(sequelize: Sequelize): void {
    ClaimLocationModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'community',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            gps: {
                type: DataTypes.JSON,
                allowNull: false
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'ubi_claim_location',
            modelName: 'ubiClaimLocation',
            updatedAt: false,
            sequelize
        }
    );
}
