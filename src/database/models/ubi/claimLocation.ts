import { Sequelize, DataTypes, Model } from 'sequelize';

interface ClaimLocationAttributes {
    id: number;
    communityId: string;
    gps: {
        latitude: number;
        longitude: number;
    };

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
interface ClaimLocationCreationAttributes {
    communityId: string;
    gps: {
        latitude: number;
        longitude: number;
    };
}

export class ClaimLocation extends Model<
    ClaimLocationAttributes,
    ClaimLocationCreationAttributes
> {
    public id!: number;
    public communityId!: string;
    public gps!: {
        latitude: number;
        longitude: number;
    };

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeClaimLocation(sequelize: Sequelize): void {
    ClaimLocation.init(
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
                onDelete: 'SET NULL',
                allowNull: false,
            },
            gps: {
                type: DataTypes.JSON,
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
            tableName: 'claimlocation',
            sequelize,
        }
    );
}
