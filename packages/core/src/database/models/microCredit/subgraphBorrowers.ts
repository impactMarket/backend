import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../../database/db';
import {
    SubgraphMicroCreditBorrowers,
    SubgraphMicroCreditBorrowersCreation
} from '../../../interfaces/microCredit/subgraphBorrowers';

export class SubgraphMicroCreditBorrowersModel extends Model<
    SubgraphMicroCreditBorrowers,
    SubgraphMicroCreditBorrowersCreation
> {
    public id!: number;
    public userId!: number;
    public lastRepayment!: number;
    public lastRepaymentAmount!: number;
    public lastDebt!: number;
    public amount!: number;
    public period!: number;
    public claimed!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeSubgraphMicroCreditBorrowers(sequelize: Sequelize): typeof SubgraphMicroCreditBorrowersModel {
    const { appUser } = sequelize.models as DbModels;
    SubgraphMicroCreditBorrowersModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: appUser,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            lastRepayment: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            lastRepaymentAmount: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            lastDebt: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            amount: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            period: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            claimed: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'subgraph_microcredit_borrowers',
            modelName: 'subgraphMicroCreditBorrowers',
            sequelize
        }
    );
    return SubgraphMicroCreditBorrowersModel;
}
