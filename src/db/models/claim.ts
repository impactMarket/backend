import { Sequelize, DataTypes, Model } from 'sequelize';

interface ClaimAttributes {
    id: number;
    address: string;
    communityId: string;
    amount: string;
    tx: string;
    txAt: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
};
interface ClaimCreationAttributes {
    address: string;
    communityId: string;
    amount: string;
    tx: string;
    txAt: Date;
};

export class Claim extends Model<ClaimAttributes, ClaimCreationAttributes> {
    public id!: number;
    public address!: string;
    public communityId!: string;
    public amount!: string;
    public tx!: string;
    public txAt!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeClaim(sequelize: Sequelize): void {
    Claim.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            communityId: {
                type: DataTypes.UUID,
                references: {
                    model: 'community', // name of Target model
                    key: 'publicId', // key in Target model that we're referencing
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            amount: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(24), // max 999,999 - plus 18 decimals
                allowNull: false,
            },
            tx: {
                type: DataTypes.STRING(68),
                unique: true,
                allowNull: false,
            },
            txAt: {
                type: DataTypes.DATE,
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
            tableName: 'claim',
            sequelize,
        }
    );
}
