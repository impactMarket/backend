import { Sequelize, DataTypes, Model } from 'sequelize';


export class ClaimLocation extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public gps!: any;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeClaimLocation(sequelize: Sequelize): void {
    return ClaimLocation.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        gps: {
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
        tableName: 'claimLocation',
        sequelize: sequelize, // this bit is important
    });
}