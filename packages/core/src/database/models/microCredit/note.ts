import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../db';
import { MicroCreditNote, MicroCreditNoteCreationAttributes } from '../../../interfaces/microCredit/note';

export class MicroCreditNoteModel extends Model<MicroCreditNote, MicroCreditNoteCreationAttributes> {
    public id!: number;
    public userId!: number;
    public managerId!: number;
    public note!: string;

    // timestamps!
    public readonly createdAt!: Date;
}

export function initializeMicroCreditNote(sequelize: Sequelize): typeof MicroCreditNoteModel {
    const { appUser } = sequelize.models as DbModels;
    MicroCreditNoteModel.init(
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
            managerId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            note: {
                type: DataTypes.STRING(512),
                allowNull: false
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'microcredit_note',
            modelName: 'microCreditNote',
            updatedAt: false,
            sequelize
        }
    );
    return MicroCreditNoteModel;
}
