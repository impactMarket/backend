import { Sequelize, DataTypes, Model } from 'sequelize';

import { WalletAirdropProof } from './walletAirdropProof';

export interface WalletAirdropUser {
    id: number;
    address: string;
    index: number;
    amount: string;

    proof?: WalletAirdropProof[];
}

export interface WalletAirdropUserCreationAttributes {
    address: string;
    index: number;
    amount: string;

    proof?: WalletAirdropProof[];
}

export class WalletAirdropUserModel extends Model<
    WalletAirdropUser,
    WalletAirdropUserCreationAttributes
> {
    public id!: number;
    public address!: string;
    public index!: number;
    public amount!: string;
}

export function initializeWalletAirdropUser(
    sequelize: Sequelize
): typeof WalletAirdropUserModel {
    WalletAirdropUserModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            index: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            amount: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },
        },
        {
            tableName: 'wallet_airdrop_user',
            timestamps: false,
            sequelize,
        }
    );
    return WalletAirdropUserModel;
}
