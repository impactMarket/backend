import { DataTypes, Model, Sequelize } from 'sequelize';

import { SubgraphUBICommunity, SubgraphUBICommunityCreation } from '../../../interfaces/ubi/subgraphUBICommunity';

export class SubgraphUBICommunityModel extends Model<SubgraphUBICommunity, SubgraphUBICommunityCreation> {
    public id!: number;
    public communityAddress!: string;
    public estimatedFunds!: number;
    public claims!: number;
    public claimed!: number;
    public beneficiaries!: number;
    public removedBeneficiaries!: number;
    public contributed!: number;
    public contributors!: number;
    public managers!: number;
    public baseInterval!: number;
    public state!: number;

    // timestamps!
    public readonly updatedAt!: Date;
}

export function initializeSubgraphUBICommunity(sequelize: Sequelize): typeof SubgraphUBICommunityModel {
    SubgraphUBICommunityModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            communityAddress: {
                type: DataTypes.STRING,
                allowNull: false
            },
            estimatedFunds: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            claims: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            claimed: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            beneficiaries: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            removedBeneficiaries: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            contributed: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            contributors: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            managers: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            baseInterval: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            state: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'subgraph_ubi_community',
            modelName: 'subgraphUBICommunity',
            createdAt: false,
            sequelize
        }
    );
    return SubgraphUBICommunityModel;
}
