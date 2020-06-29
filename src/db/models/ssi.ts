import { Sequelize, DataTypes, Model } from 'sequelize';


export class SSI extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public communityId!: number;
    public date!: Date;
    public ssi!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeSSI(sequelize: Sequelize): void {
    SSI.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        communityId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        ssi: {
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
        tableName: 'ssi',
        sequelize: sequelize, // this bit is important
    });
    return;
}