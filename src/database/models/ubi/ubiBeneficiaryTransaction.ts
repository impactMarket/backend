import {
    UbiBeneficiaryTransaction,
    UbiBeneficiaryTransactionCreation,
} from '@interfaces/ubi/ubiBeneficiaryTransaction';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiBeneficiaryTransactionModel extends Model<
    UbiBeneficiaryTransaction,
    UbiBeneficiaryTransactionCreation
> {
    public id!: number;
    public beneficiary!: string;
    public withAddress!: string;
    public amount!: string;
    public isFromBeneficiary!: boolean;
    public tx!: string;
    public date!: Date;
    public txAt!: Date;
}

export function initializeUbiBeneficiaryTransaction(
    sequelize: Sequelize
): void {
    UbiBeneficiaryTransactionModel.init(
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
            txAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: new Date(),
            },
        },
        {
            tableName: 'ubi_beneficiary_transaction',
            timestamps: false,
            sequelize,
        }
    );
}
