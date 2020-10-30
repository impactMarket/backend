import { Sequelize, DataTypes, Model } from 'sequelize';


export class Claim extends Model {
    public id!: number;
    public address!: string;
    public communityId!: string;
    public amount!: string;
    public tx!: string;
    public txAt!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeClaim(sequelize: Sequelize): void {
    return Claim.init({
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        address: {
            type: DataTypes.STRING(44),
            allowNull: false
        },
        communityId: {
            type: DataTypes.UUID,
            references: {
                model: 'community', // name of Target model
                key: 'publicId', // key in Target model that we're referencing
            },
            onDelete: 'RESTRICT',
            allowNull: false
        },
        amount: {
            type: DataTypes.STRING(32), // we are saving all decimals, 18
            allowNull: false,
        },
        tx: {
            type: DataTypes.STRING(68),
            unique: true,
            allowNull: false,
        },
        txAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        }
    }, {
        tableName: 'claim',
        sequelize: sequelize, // this bit is important
    });
}