import { Sequelize, DataTypes, Model } from 'sequelize';

export interface CommunityStateAttributes {
    communityId: string;
    claimed: string;
    claims: number;
    beneficiaries: number;
    raised: string;
    backers: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

interface CommunityStateCreationAttributes {
    communityId: string;
};

export class CommunityState extends Model<CommunityStateAttributes, CommunityStateCreationAttributes> {
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
    CommunityState.init(
        {
            communityId: {
                type: DataTypes.UUID,
                primaryKey: true,
                unique: true,
                references: {
                    model: 'community', // name of Target model
                    key: 'publicId', // key in Target model that we're referencing
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            claimed: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                defaultValue: 0,
                allowNull: false,
            },
            claims: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            beneficiaries: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            raised: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                defaultValue: 0,
                allowNull: false,
            },
            backers: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
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
            tableName: 'communitystate',
            sequelize,
        }
    );
}
