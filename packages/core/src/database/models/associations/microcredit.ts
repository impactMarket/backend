import { DbModels } from '../../../database/db';
import { Sequelize } from 'sequelize';

export function microcreditNoteAssociation(sequelize: Sequelize) {
    const { microCreditNote, appUser } = sequelize.models as DbModels;

    microCreditNote.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });
}
