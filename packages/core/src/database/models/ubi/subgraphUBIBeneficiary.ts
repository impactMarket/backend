import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppUserModel } from '../app/appUser';
import { SubgraphUBIBeneficiary, SubgraphUBIBeneficiaryCreation } from '../../../interfaces/ubi/subgraphUBIBeneficiary';

export class SubgraphUBIBeneficiaryModel extends Model<SubgraphUBIBeneficiary, SubgraphUBIBeneficiaryCreation> {
    public id!: number;
    public userAddress!: string;
    public communityAddress!: string;
    public claimed!: number | null;
    public since!: number | null;
    public state!: number | null;

    public readonly user?: AppUserModel;

    // timestamps!
    public readonly updatedAt!: Date;
}

export function initializeSubgraphUBIBeneficiary(sequelize: Sequelize): typeof SubgraphUBIBeneficiaryModel {
    SubgraphUBIBeneficiaryModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            userAddress: {
                type: DataTypes.STRING,
                allowNull: false
            },
            communityAddress: {
                type: DataTypes.STRING,
                allowNull: false
            },
            since: {
                type: DataTypes.INTEGER
            },
            claimed: {
                type: DataTypes.FLOAT
            },
            state: {
                type: DataTypes.INTEGER
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            tableName: 'subgraph_ubi_beneficiary',
            modelName: 'subgraphUBIBeneficiary',
            createdAt: false,
            sequelize
        }
    );
    return SubgraphUBIBeneficiaryModel;
}
