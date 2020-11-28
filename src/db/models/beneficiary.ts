import { Sequelize, DataTypes, Model } from 'sequelize';

export class Beneficiary extends Model {
    public id!: number;
    public address!: string;
    public communityId!: string;
    public active!: boolean;
    public txAt!: Date;
    public claims!: number;
    public lastClaimAt!: Date;
    public penultimateClaimAt!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeBeneficiary(sequelize: Sequelize): void {
    return Beneficiary.init(
        {
            id: {
                type: DataTypes.INTEGER,
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
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            txAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            claims: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            lastClaimAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            penultimateClaimAt: {
                type: DataTypes.DATE,
                allowNull: true,
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
            tableName: 'beneficiary',
            sequelize: sequelize, // this bit is important
        }
    );
}
