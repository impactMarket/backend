import { DataTypes, Model, Sequelize } from 'sequelize';

import { CommunityAttributes, ICommunityCreationAttributes } from '../../../interfaces/ubi/community';

export class Community extends Model<CommunityAttributes, ICommunityCreationAttributes> {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public requestByAddress!: string;
    public contractAddress!: string | null;
    public name!: string;
    public description!: string;
    public language!: string;
    public currency!: string;
    public city!: string;
    public country!: string;
    public gps!: {
        latitude: number;
        longitude: number;
    };
    public email!: string;
    public visibility!: 'public' | 'private';
    public coverMediaPath!: string | null;
    public status!: 'pending' | 'valid' | 'removed'; // pending / valid / removed
    public review!: 'pending' | 'claimed' | 'declined' | 'accepted';
    public started!: Date;
    public proposalId!: number | null;
    public ambassadorAddress!: string | null;
    public placeId!: string | null;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

export function initializeCommunity(sequelize: Sequelize): void {
    Community.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            requestByAddress: {
                type: DataTypes.STRING(44),
                unique: true,
                allowNull: false
            },
            contractAddress: {
                type: DataTypes.STRING(44)
            },
            name: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            description: {
                type: DataTypes.STRING(1024),
                allowNull: false
            },
            language: {
                type: DataTypes.STRING(8),
                defaultValue: 'en',
                allowNull: false
            },
            currency: {
                type: DataTypes.STRING(4),
                defaultValue: 'USD',
                allowNull: false
            },
            city: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            country: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            gps: {
                type: DataTypes.JSON,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            visibility: {
                type: DataTypes.ENUM('public', 'private'),
                allowNull: false
            },
            coverMediaPath: {
                type: DataTypes.STRING(44),
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM('pending', 'valid', 'removed'),
                allowNull: false
            },
            review: {
                type: DataTypes.ENUM('pending', 'claimed', 'declined', 'accepted'),
                defaultValue: 'pending',
                allowNull: false
            },
            started: {
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            proposalId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            ambassadorAddress: {
                type: DataTypes.STRING(44),
                allowNull: true
            },
            placeId: {
                type: DataTypes.STRING(44),
                allowNull: true
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: 'community',
            modelName: 'community',
            sequelize
        }
    );
}
