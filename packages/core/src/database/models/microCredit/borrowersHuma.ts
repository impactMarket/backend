import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../../database/db';
import {
    MicroCreditBorrowersHuma,
    MicroCreditBorrowersHumaCreation
} from '../../../interfaces/microCredit/borrowersHuma';

export class MicroCreditBorrowersHumaModel extends Model<MicroCreditBorrowersHuma, MicroCreditBorrowersHumaCreation> {
    public id!: number;
    public userId!: number;
    public humaRWRReferenceId!: string;
    public repaid!: boolean;
}

export function initializeMicroCreditBorrowersHuma(sequelize: Sequelize): typeof MicroCreditBorrowersHumaModel {
    const { appUser } = sequelize.models as DbModels;
    MicroCreditBorrowersHumaModel.init(
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
            humaRWRReferenceId: {
                allowNull: false,
                type: DataTypes.STRING(64)
            },
            repaid: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        },
        {
            tableName: 'microcredit_borrowers_huma',
            modelName: 'microCreditBorrowersHuma',
            sequelize,
            timestamps: false
        }
    );
    return MicroCreditBorrowersHumaModel;
}
