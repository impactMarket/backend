import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../../database/db';
import { MicroCreditDocs, MicroCreditDocsCreationAttributes } from '../../../interfaces/microCredit/docs';

export class MicroCreditDocsModel extends Model<MicroCreditDocs, MicroCreditDocsCreationAttributes> {
    public id!: number;
    public userId!: number;
    public category!: number;
    public filepath!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeMicroCreditDocs(sequelize: Sequelize): typeof MicroCreditDocsModel {
    const { appUser } = sequelize.models as DbModels;
    MicroCreditDocsModel.init(
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
            category: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            filepath: {
                type: DataTypes.STRING,
                allowNull: false
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
            tableName: 'microcredit_docs',
            modelName: 'microCreditDocs',
            sequelize
        }
    );
    return MicroCreditDocsModel;
}
