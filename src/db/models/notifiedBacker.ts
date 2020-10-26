import { Sequelize, DataTypes, Model } from 'sequelize';


export class NotifiedBacker extends Model {
    public id!: number;
    public backer!: string;
    public community!: string;
    public at!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeNotifiedBacker(sequelize: Sequelize): void {
    return NotifiedBacker.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        backer: {
            type: DataTypes.STRING(44),
            allowNull: false,
        },
        community: {
            type: DataTypes.STRING(44),
            allowNull: false,
        },
        at: {
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
        tableName: 'notifiedBacker',
        sequelize: sequelize, // this bit is important
    });
}