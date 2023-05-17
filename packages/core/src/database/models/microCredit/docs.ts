import { Sequelize, DataTypes, Model } from 'sequelize';

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
                    model: sequelize.models.AppUserModel,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            category: {
                type: DataTypes.NUMBER,
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
            sequelize
        }
    );
    return MicroCreditDocsModel;
}
