import { Sequelize, DataTypes, Model } from 'sequelize';


export class CommunityState extends Model {
    public id!: number;
    public communityId!: string;
    public claimed!: string;
    public claims!: number;
    public beneficiaries!: number;
    public raised!: string;
    public backers!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeCommunityState(sequelize: Sequelize): void {
    return CommunityState.init({
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
        claimed: {
            type: DataTypes.STRING(48), // max 999999999999999999999999999999.999999999999999999 - 18 decimals
            allowNull: false,
        },
        claims: {
            type: DataTypes.INTEGER, // max 2,147,483,647
            allowNull: false,
        },
        beneficiaries: {
            type: DataTypes.INTEGER, // max 2,147,483,647
            allowNull: false,
        },
        raised: {
            type: DataTypes.STRING(48), // max 999999999999999999999999999999.999999999999999999 - 18 decimals
            allowNull: false,
        },
        backers: {
            type: DataTypes.INTEGER, // max 2,147,483,647
            allowNull: false,
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
        tableName: 'communitystate',
        sequelize: sequelize, // this bit is important
    });
}