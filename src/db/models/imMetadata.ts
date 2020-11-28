import { Sequelize, DataTypes, Model } from 'sequelize';

export class ImMetadata extends Model {
    public key!: string;
    public value!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeImMetadata(sequelize: Sequelize): void {
    return ImMetadata.init(
        {
            key: {
                type: DataTypes.STRING(128),
                unique: true,
                primaryKey: true,
            },
            value: {
                type: DataTypes.STRING(512),
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
            tableName: 'immetadata',
            sequelize: sequelize, // this bit is important
        }
    );
}
