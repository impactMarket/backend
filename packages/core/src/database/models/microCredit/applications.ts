import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppUserModel } from '../app/appUser';
import { DbModels } from '../../../database/db';
import { MicroCreditApplication, MicroCreditApplicationCreation } from '../../../interfaces/microCredit/applications';

export class MicroCreditApplicationModel extends Model<MicroCreditApplication, MicroCreditApplicationCreation> {
    public id!: number;
    public userId!: number;
    public form!: object;
    public selectedLoanManagerId!: number;
    public prismicId!: string;
    public amount!: number;
    public period!: number;
    public status!: number;
    public decisionOn!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly user?: AppUserModel;
}

export function initializeMicroCreditApplication(sequelize: Sequelize): typeof MicroCreditApplicationModel {
    const { appUser } = sequelize.models as DbModels;
    MicroCreditApplicationModel.init(
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
            form: {
                type: DataTypes.JSONB,
                allowNull: true
            },
            selectedLoanManagerId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            prismicId: {
                type: DataTypes.STRING(32),
                allowNull: true
            },
            amount: {
                allowNull: true,
                type: DataTypes.INTEGER
            },
            period: {
                allowNull: true,
                type: DataTypes.INTEGER
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            decisionOn: {
                allowNull: true,
                type: DataTypes.DATE
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
            tableName: 'microcredit_applications',
            modelName: 'microCreditApplications',
            sequelize
        }
    );
    return MicroCreditApplicationModel;
}
