import { Sequelize, DataTypes, Model } from 'sequelize';

import { MicroCreditApplications, MicroCreditApplicationsCreation } from '../../../interfaces/microCredit/applications';
import { DbModels } from '../../../database/db';
import { AppUserModel } from '../app/appUser';

export class MicroCreditApplicationsModel extends Model<MicroCreditApplications, MicroCreditApplicationsCreation> {
    public id!: number;
    public userId!: number;
    public amount!: number;
    public period!: number;
    public status!: number;
    public decisionOn!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly user?: AppUserModel;
}

export function initializeMicroCreditApplications(sequelize: Sequelize): typeof MicroCreditApplicationsModel {
    const { appUser } = sequelize.models as DbModels;
    MicroCreditApplicationsModel.init(
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
            amount: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            period: {
                allowNull: false,
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
    return MicroCreditApplicationsModel;
}
