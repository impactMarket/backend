import { DataTypes, Model, Sequelize } from 'sequelize';

export interface WalletAirdropProof {
    id: number;
    userId: number;
    hashProof: string;
}

export interface WalletAirdropProofCreationAttributes {
    userId: number;
    hashProof: string;
}

export class WalletAirdropProofModel extends Model<WalletAirdropProof, WalletAirdropProofCreationAttributes> {
    public id!: number;
    public userId!: number;
    public hashProof!: string;
}

export function initializeWalletAirdropProof(sequelize: Sequelize): typeof WalletAirdropProofModel {
    WalletAirdropProofModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            hashProof: {
                type: DataTypes.STRING(68),
                allowNull: false
            }
        },
        {
            tableName: 'wallet_airdrop_proof',
            modelName: 'walletAirdropProof',
            timestamps: false,
            sequelize
        }
    );
    return WalletAirdropProofModel;
}
