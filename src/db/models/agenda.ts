import { Sequelize, DataTypes, Model } from 'sequelize';


export class Agenda extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public when!: Date;
    public action!: string;
    public data!: any;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeAgenda(sequelize: Sequelize): void {
    return Agenda.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        when: {
            type: DataTypes.DATE,
            allowNull: false
        },
        action: {
            type: DataTypes.ENUM('notification'),
            allowNull: false
        },
        data: {
            type: DataTypes.JSON,
            allowNull: false
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
        tableName: 'agenda',
        sequelize: sequelize, // this bit is important
    });
}