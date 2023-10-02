import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppUserModel } from '../app/appUser';
import { DbModels } from '../../../database/db';
import { MicroCreditLoanManager, MicroCreditLoanManagerAttributes } from '../../../interfaces/microCredit/loanManager';

export class MicroCreditLoanManagerModel extends Model<MicroCreditLoanManager, MicroCreditLoanManagerAttributes> {
    public id!: number;
    public userId!: number;
    public country!: string;
    public fundsSource!: number[];

    public readonly user?: AppUserModel;
}

export function initializeMicroCreditLoanManager(sequelize: Sequelize): typeof MicroCreditLoanManagerModel {
    const { appUser } = sequelize.models as DbModels;
    MicroCreditLoanManagerModel.init(
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
            country: {
                type: DataTypes.STRING,
                allowNull: false
            },
            fundsSource: {
                type: DataTypes.ARRAY(DataTypes.INTEGER),
                defaultValue: [0],
                allowNull: false
            }
        },
        {
            tableName: 'microcredit_loan_manager',
            modelName: 'microCreditLoanManager',
            sequelize,
            timestamps: false
        }
    );
    return MicroCreditLoanManagerModel;
}
