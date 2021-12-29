import { Sequelize, DataTypes, Model } from 'sequelize';

export interface AirgrabProof {
    id: number;
    user: number;
    address: string;
}

export interface AirgrabProofCreationAttributes {
    user: number;
    address: string;
}

export class AirgrabProofModel extends Model<
    AirgrabProof,
    AirgrabProofCreationAttributes
> {
    public id!: number;
    public user!: number;
    public address!: string;
}

export function initializeAirgrabProof(
    sequelize: Sequelize
): typeof AirgrabProofModel {
    AirgrabProofModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            address: {
                type: DataTypes.STRING(68),
                allowNull: false,
            },
        },
        {
            tableName: 'airgrab_proof',
            timestamps: false,
            sequelize,
        }
    );
    return AirgrabProofModel;
}
