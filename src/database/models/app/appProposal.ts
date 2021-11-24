import { AppProposal, AppProposalCreation } from '@interfaces/app/appProposal';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppProposalModel extends Model<AppProposal, AppProposalCreation> {
    public id!: number;
    public status!: number;
    public endBlock!: number;
}

export function initializeAppProposal(sequelize: Sequelize): void {
    AppProposalModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            endBlock: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: 'app_proposal',
            timestamps: false,
            sequelize,
        }
    );
}
