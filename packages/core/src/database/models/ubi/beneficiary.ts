import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    BeneficiaryAttributes,
    BeneficiaryCreationAttributes,
} from '../../../interfaces/ubi/beneficiary';

export class Beneficiary extends Model<
    BeneficiaryAttributes,
    BeneficiaryCreationAttributes
> {
    public id!: number;
    public address!: string;
    public communityId!: number;
    public active!: boolean;
    public blocked!: boolean;
    public tx!: string;
    public txAt!: Date;
    public claims!: number;
    public claimed!: string;
    public lastClaimAt!: Date | null;
    public penultimateClaimAt!: Date | null;
    public readRules!: boolean;

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
                // this is associated with user table
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            communityId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            blocked: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
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
            },
            claimed: {
                type: DataTypes.DECIMAL(22), // max 9,999 - plus 18 decimals
                defaultValue: 0,
            },
            lastClaimAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            penultimateClaimAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            readRules: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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
            modelName: 'beneficiary',
            sequelize,
        }
    );
}
