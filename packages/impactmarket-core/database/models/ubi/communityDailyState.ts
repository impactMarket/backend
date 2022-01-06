import {
    UbiCommunityDailyState,
    UbiCommunityDailyStateCreation,
} from '../../../interfaces/ubi/ubiCommunityDailyState';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiCommunityDailyStateModel extends Model<
    UbiCommunityDailyState,
    UbiCommunityDailyStateCreation
> {
    public id!: number;
    public communityId!: number;
    public claimed!: string;
    public claims!: number;
    public beneficiaries!: number;
    public raised!: string;
    public backers!: number;
    public monthlyBackers!: number;
    public volume!: string;
    public transactions!: number;
    public reach!: number;
    public reachOut!: number;
    public fundingRate!: number;
    public date!: Date;
}

export function initializeUbiCommunityDailyState(sequelize: Sequelize): void {
    UbiCommunityDailyStateModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'community', // name of Target model
                    key: 'id', // key in Target model that we're referencing
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            claimed: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                defaultValue: 0,
            },
            claims: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            },
            beneficiaries: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            },
            raised: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                defaultValue: 0,
            },
            backers: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            },
            monthlyBackers: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            },
            volume: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                defaultValue: 0,
            },
            transactions: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            },
            reach: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            },
            reachOut: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            },
            fundingRate: {
                type: DataTypes.FLOAT,
                defaultValue: 0,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_community_daily_state',
            sequelize,
            timestamps: false,
        }
    );
}
