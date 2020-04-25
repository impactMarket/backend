import { Sequelize, DataTypes, Model } from 'sequelize';


export class Beneficiary extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public walletAddress!: string;
    public communityPublicId!: string;
    // No status. Remove entry when accepted

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


export function initializeBeneficiary(sequelize: Sequelize) {
    return Beneficiary.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        walletAddress: {
            type: DataTypes.STRING(44),
            allowNull: false,
        },
        communityPublicId: {
            type: DataTypes.STRING(38),
            allowNull: false,
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
        tableName: 'beneficiary',
        sequelize: sequelize, // this bit is important
    });
}