import { Sequelize, DataTypes, Model } from 'sequelize';

export class ReachedAddress extends Model {
    public address!: string;
    public lastInteraction!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeReachedAddress(sequelize: Sequelize): void {
    ReachedAddress.init(
        {
            address: {
                type: DataTypes.STRING(44),
                allowNull: false,
                unique: true,
                primaryKey: true,
            },
            lastInteraction: {
                type: DataTypes.DATEONLY,
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
            tableName: 'reachedaddress',
            sequelize, // this bit is important
        }
    );
}
