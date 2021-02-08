import { GlobalGrowth, GlobalGrowthCreation } from '@interfaces/globalGrowth';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class GlobalGrowthModel extends Model<
    GlobalGrowth,
    GlobalGrowthCreation
> {
    public date!: Date;
    public claimed!: number;
    public claims!: number;
    public beneficiaries!: number;
    public raised!: number;
    public backers!: number;
    public fundingRate!: number;
    public volume!: number;
    public transactions!: number;
    public reach!: number;
    public reachOut!: number;
    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeGlobalGrowth(
    sequelize: Sequelize
): typeof GlobalGrowthModel {
    GlobalGrowthModel.init(
        {
            date: {
                type: DataTypes.DATEONLY,
                primaryKey: true,
                unique: true,
                allowNull: false,
            },
            claimed: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            claims: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            beneficiaries: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            raised: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            backers: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            fundingRate: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            volume: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            transactions: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            reach: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            reachOut: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'globaldailygrowth',
            sequelize,
        }
    );
    return GlobalGrowthModel;
}
