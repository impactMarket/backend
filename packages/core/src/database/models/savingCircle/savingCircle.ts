import { DataTypes, Model, Sequelize } from 'sequelize';
import { DbModels } from '../../../database/db';

import { SavingCircle, SavingCircleCreation } from '../../../interfaces/savingCircle/savingCircle';

export class SavingCircleModel extends Model<SavingCircle, SavingCircleCreation> {
    public id!: number;
    public name!: string;
    public country!: string;
    public amount!: number;
    public frequency!: number;
    public firstDepositOn!: Date;
    public requestedBy!: number;
    public status!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeSavingCircle(sequelize: Sequelize): typeof SavingCircleModel {
    const { appUser } = sequelize.models as DbModels;
    SavingCircleModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            country: {
                type: DataTypes.STRING(2),
                allowNull: false
            },
            amount: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            frequency: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            firstDepositOn: {
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            requestedBy: {
                type: DataTypes.INTEGER,
                unique: true,
                references: {
                    model: appUser,
                    key: 'id'
                },
                allowNull: false
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
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
            tableName: 'saving_circle',
            modelName: 'savingCircle',
            sequelize
        }
    );
    return SavingCircleModel;
}
