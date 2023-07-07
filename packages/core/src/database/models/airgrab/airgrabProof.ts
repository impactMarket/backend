import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AirgrabProof {
    id: number;
    userId: number;
    hashProof: string;
}

export interface AirgrabProofCreationAttributes {
    userId: number;
    hashProof: string;
}

export class AirgrabProofModel extends Model<AirgrabProof, AirgrabProofCreationAttributes> {
    public id!: number;
    public userId!: number;
    public hashProof!: string;
}

export function initializeAirgrabProof(sequelize: Sequelize): typeof AirgrabProofModel {
    AirgrabProofModel.init(
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
            tableName: 'airgrab_proof',
            modelName: 'airgrabProof',
            timestamps: false,
            sequelize
        }
    );
    return AirgrabProofModel;
}
