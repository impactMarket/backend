import { DataTypes, Model, Sequelize } from 'sequelize';

import { AirgrabProof } from './airgrabProof';

export interface AirgrabUser {
    id: number;
    address: string;
    index: number;
    amount: string;

    proof?: AirgrabProof[];
}

export interface AirgrabUserCreationAttributes {
    address: string;
    index: number;
    amount: string;

    proof?: AirgrabProof[];
}

export class AirgrabUserModel extends Model<AirgrabUser, AirgrabUserCreationAttributes> {
    public id!: number;
    public address!: string;
    public index!: number;
    public amount!: string;
}

export function initializeAirgrabUser(sequelize: Sequelize): typeof AirgrabUserModel {
    AirgrabUserModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            address: {
                type: DataTypes.STRING(44),
                allowNull: false
            },
            index: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            amount: {
                type: DataTypes.STRING(32),
                allowNull: false
            }
        },
        {
            tableName: 'airgrab_user',
            modelName: 'airgrabUser',
            timestamps: false,
            sequelize
        }
    );
    return AirgrabUserModel;
}
