import { Sequelize, DataTypes, Model } from 'sequelize';


export class Community extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public publicId!: string;
    public requestByAddress!: string;
    public contractAddress!: string;
    public name!: string;
    public description!: string;
    public location!: any;
    public coverImage!: string;
    // *claim amount* is on contract
    // *frequency* is on contract
    // *time increment* is on contract
    // *full amount* per beneficiary is on contract
    public status!: string; // pending / valid / removed

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


export function initializeCommunity(sequelize: Sequelize) {
    return Community.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        publicId: {
            type: DataTypes.UUID,
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
        location: {
            type: DataTypes.JSON,
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
}