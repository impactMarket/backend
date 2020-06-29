import { Sequelize, DataTypes, Model } from 'sequelize';
import { ICommunityVars } from '../../types';


export class Community extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public publicId!: string;
    public requestByAddress!: string;
    public contractAddress!: string;
    public name!: string;
    public description!: string;
    public city!: string;
    public country!: string;
    public gps!: {
        latitude: number;
        longitude: number;
    };
    public email!: string;
    public visibility!: string;
    public coverImage!: string;
    public status!: string; // pending / valid / removed
    public txCreationObj!: ICommunityVars;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


export function initializeCommunity(sequelize: Sequelize): void {
    Community.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        publicId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
            allowNull: false,
        },
        requestByAddress: {
            type: DataTypes.STRING(44),
            allowNull: false,
        },
        contractAddress: {
            type: DataTypes.STRING(44),
        },
        name: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(512),
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
        coverImage: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'valid', 'removed'),
            allowNull: false
        },
        txCreationObj: {
            type: DataTypes.JSON
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'community',
        sequelize: sequelize, // this bit is important
    });
    return;
}