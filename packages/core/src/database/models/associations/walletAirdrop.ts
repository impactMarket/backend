import { DbModels } from '../../../database/db';
import { Sequelize } from 'sequelize';

export function walletAidropAssociation(sequelize: Sequelize) {
    const { walletAirdropProof, walletAirdropUser } =
        sequelize.models as DbModels;

    walletAirdropUser.hasMany(walletAirdropProof, {
        foreignKey: 'userId',
        sourceKey: 'id',
        as: 'proof',
    });
}
