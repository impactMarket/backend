import { Sequelize } from 'sequelize';

export function airgrabAssociation(sequelize: Sequelize) {
    sequelize.models.AirgrabUserModel.hasMany(
        sequelize.models.AirgrabProofModel,
        {
            foreignKey: 'userId',
            sourceKey: 'id',
            as: 'proof',
        }
    );
}
