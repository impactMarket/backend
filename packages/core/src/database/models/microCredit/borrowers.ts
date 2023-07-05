import { Sequelize, DataTypes, Model } from 'sequelize';

import { MicroCreditBorrowers, MicroCreditBorrowersCreation } from '../../../interfaces/microCredit/borrowers';
import { DbModels } from '../../../database/db';
import { AppUserModel } from '../app/appUser';

export class MicroCreditBorrowersModel extends Model<MicroCreditBorrowers, MicroCreditBorrowersCreation> {
    public id!: number;
    public userId!: number;
    public performance!: number;
    public lastNotificationRepayment!: Date;
    public manager!: string;

    public readonly user?: AppUserModel;
}

export function initializeMicroCreditBorrowers(sequelize: Sequelize): typeof MicroCreditBorrowersModel {
    const { appUser } = sequelize.models as DbModels;
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
            performance: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            lastNotificationRepayment: {
                allowNull: true,
                type: DataTypes.DATE
            },
            manager: {
                allowNull: false,
                type: DataTypes.STRING(48)
            }
        },
        {
            tableName: 'microcredit_borrowers',
            modelName: 'microCreditBorrowers',
            sequelize,
            timestamps: false,
        }
    );
    return MicroCreditBorrowersModel;
}
