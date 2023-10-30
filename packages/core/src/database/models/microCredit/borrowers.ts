import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppUserModel } from '../app/appUser';
import { DbModels } from '../../../database/db';
import { MicroCreditBorrowers, MicroCreditBorrowersCreation } from '../../../interfaces/microCredit/borrowers';
import { SubgraphMicroCreditBorrowersModel } from './subgraphBorrowers';

export class MicroCreditBorrowersModel extends Model<MicroCreditBorrowers, MicroCreditBorrowersCreation> {
    public id!: number;
    public userId!: number;
    public applicationId!: number;
    public performance!: number;
    public repaymentRate!: number;
    public lastNotificationRepayment!: Date;
    public manager!: string;

    public readonly user?: AppUserModel;
    public readonly loan?: SubgraphMicroCreditBorrowersModel;
}

export function initializeMicroCreditBorrowers(sequelize: Sequelize): typeof MicroCreditBorrowersModel {
    const { appUser, microCreditApplications } = sequelize.models as DbModels;
    MicroCreditBorrowersModel.init(
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
            applicationId: {
                type: DataTypes.INTEGER,
                references: {
                    model: microCreditApplications,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                // should be false, but old borrowers did not had applications
                allowNull: true
            },
            performance: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 100
            },
            repaymentRate: {
                allowNull: true,
                type: DataTypes.INTEGER
            },
            lastNotificationRepayment: {
                allowNull: true,
                type: DataTypes.DATE
            },
            manager: {
                allowNull: true,
                type: DataTypes.STRING(48)
            }
        },
        {
            tableName: 'microcredit_borrowers',
            modelName: 'microCreditBorrowers',
            sequelize,
            timestamps: false,
            // ensure that applicationId + userId is unique
            indexes: [
                {
                    unique: true,
                    fields: ['applicationId', 'userId']
                }
            ]
        }
    );
    return MicroCreditBorrowersModel;
}
