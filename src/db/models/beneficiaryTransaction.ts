import { Sequelize, DataTypes, Model } from 'sequelize';

export interface IBeneficiaryTransaction {
    beneficiary: string;
    withAddress: string;
    amount: string;
    isFromBeneficiary: boolean;
    tx: string;
    date: Date;
}
export class BeneficiaryTransaction extends Model {
    public id!: number;
    public beneficiary!: string;
    public withAddress!: string;
    public amount!: string;
    public isFromBeneficiary!: boolean;
    public tx!: string;
    public date!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeBeneficiaryTransaction(sequelize: Sequelize): void {
    return BeneficiaryTransaction.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            beneficiary: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            withAddress: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            amount: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(26), // max 99,999,999 - plus 18 decimals
                allowNull: false,
            },
            isFromBeneficiary: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            tx: {
                type: DataTypes.STRING(68),
                unique: true,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
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
            tableName: 'beneficiarytransaction',
            sequelize, // this bit is important
        }
    );
}
