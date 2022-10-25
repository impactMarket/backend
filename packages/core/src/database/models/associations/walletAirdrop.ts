import { Sequelize } from 'sequelize';

export function walletAidropAssociation(sequelize: Sequelize) {
    sequelize.models.WalletAirdropUserModel.hasMany(
        sequelize.models.WalletAirdropProofModel,
        {
            foreignKey: 'userId',
            sourceKey: 'id',
            as: 'proof',
        }
    );
}
