import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../db';
import {
    MicroCreditForm,
    MicroCreditFormCreationAttributes,
    MicroCreditFormStatus
} from '../../../interfaces/microCredit/form';

export class MicroCreditFormModel extends Model<MicroCreditForm, MicroCreditFormCreationAttributes> {
    public id!: number;
    public userId!: number;
    public form!: object;
    public prismicId!: string;
    public status!: MicroCreditFormStatus;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeMicroCreditForm(sequelize: Sequelize): typeof MicroCreditFormModel {
    const { appUser } = sequelize.models as DbModels;
    MicroCreditFormModel.init(
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
                allowNull: false
            },
            prismicId: {
                type: DataTypes.STRING(32),
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('pending', 'submitted', 'in-review', 'approved', 'rejected'),
                allowNull: false,
                defaultValue: 'pending'
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
            tableName: 'microcredit_form',
            modelName: 'microCreditForm',
            sequelize
        }
    );
    return MicroCreditFormModel;
}
