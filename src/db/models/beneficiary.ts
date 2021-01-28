import { Sequelize, DataTypes, Model } from 'sequelize';

interface BeneficiaryAttributes {
    id: number;
    address: string;
    communityId: string;
    active: boolean;
    tx: string;
    txAt: Date;
    claims: number;
    lastClaimAt: Date | null;
    penultimateClaimAt: Date | null;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
interface BeneficiaryCreationAttributes {
    address: string;
    communityId: string;
    tx: string;
    txAt: Date;
}

export class Beneficiary extends Model<
    BeneficiaryAttributes,
    BeneficiaryCreationAttributes
> {
    public id!: number;
    public address!: string;
    public communityId!: string;
    public active!: boolean;
    public tx!: string;
    public txAt!: Date;
    public claims!: number;
    public lastClaimAt!: Date | null;
    public penultimateClaimAt!: Date | null;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeBeneficiary(sequelize: Sequelize): void {
    Beneficiary.init(
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
                    model: 'community',
                    key: 'publicId',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
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
            sequelize,
        }
    );
}
