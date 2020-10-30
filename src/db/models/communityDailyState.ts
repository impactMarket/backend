import { Sequelize, DataTypes, Model } from 'sequelize';


export class CommunityDailyState extends Model {
    public id!: number;
    public communityId!: string;
    public claimed!: string;
    public claims!: number;
    public beneficiaries!: number;
    public raised!: string;
    public backers!: number;
    public date!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeCommunityDailyState(sequelize: Sequelize): void {
    return CommunityDailyState.init({
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
        tableName: 'communitydailystate',
        sequelize: sequelize, // this bit is important
    });
}