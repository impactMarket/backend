import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppUserModel } from '../app/appUser';
import { DbModels } from '../../../database/db';
import { SavingCircleMember, SavingCircleMemberCreation } from '../../../interfaces/savingCircle/savingCircleMember';
import { SavingCircleModel } from './savingCircle';

export class SavingCircleMemberModel extends Model<SavingCircleMember, SavingCircleMemberCreation> {
    public id!: number;
    public userId!: number;
    public groupId!: number;
    public accept!: boolean;
    public decisionOn!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly user?: AppUserModel;
    public readonly group?: SavingCircleModel;
}

export function initializeSavingCircleMember(sequelize: Sequelize): typeof SavingCircleMemberModel {
    const { appUser, savingCircle } = sequelize.models as DbModels;
    SavingCircleMemberModel.init(
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
            groupId: {
                type: DataTypes.INTEGER,
                references: {
                    model: savingCircle,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            accept: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            decisionOn: {
                type: DataTypes.DATE,
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
            tableName: 'saving_circle_member',
            modelName: 'savingCircleMember',
            sequelize
        }
    );
    return SavingCircleMemberModel;
}
