import { Sequelize, DataTypes, Model } from 'sequelize';


export class CommunityCreation extends Model {
    public publicId!: string;
    public amountByClaim!: number;
    public baseInterval!: number;
    public incrementalInterval!: number;
    public claimHardcap!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


export function initializeCommunityCreation(sequelize: Sequelize) {
    return CommunityCreation.init({
        publicId: {
            type: DataTypes.UUID,
            unique: true,
            allowNull: false,
        },
        amountByClaim: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        baseInterval: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        incrementalInterval: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        claimHardcap: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'communitycreation',
        sequelize: sequelize, // this bit is important
    });
}