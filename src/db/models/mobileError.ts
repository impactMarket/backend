import { Sequelize, DataTypes, Model } from 'sequelize';

interface MobileErrorAttributes {
    id: number;
    version: string;
    address: string;
    action: string;
    error: string;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
};
interface MobileErrorCreationAttributes {
    version: string;
    address: string;
    action: string;
    error: string;
};
export class MobileError extends Model<MobileErrorAttributes, MobileErrorCreationAttributes> {
    public id!: number;
    public version!: string;
    public address!: string;
    public action!: string;
    public error!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeMobileError(sequelize: Sequelize): void {
    MobileError.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            version: {
                type: DataTypes.STRING(8),
                allowNull: true,
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
                type: DataTypes.STRING(512),
                allowNull: true,
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
            tableName: 'mobileerror',
            sequelize,
        }
    );
}
