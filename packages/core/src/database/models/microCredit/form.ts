import { Sequelize, DataTypes, Model } from 'sequelize';

import { MicroCreditForm, MicroCreditFormCreationAttributes } from '../../../interfaces/microCredit/form';
import { DbModels } from '../../db';

export class MicroCreditFormModel extends Model<MicroCreditForm, MicroCreditFormCreationAttributes> {
    public id!: number;
    public userId!: number;
    public form!: object;
    public submitted?: boolean;

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
            submitted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
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
