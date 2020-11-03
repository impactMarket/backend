import { Sequelize, DataTypes, Model } from 'sequelize';


export class MobileError extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public address!: string;
    public action!: string;
    public error!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeMobileError(sequelize: Sequelize): void {
    return MobileError.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        address: {
            type: DataTypes.STRING(44),
            allowNull: true,
        },
        action: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        error: {
            type: DataTypes.STRING(256),
            allowNull: true,
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
        tableName: 'mobileerror',
        sequelize: sequelize, // this bit is important
    });
}