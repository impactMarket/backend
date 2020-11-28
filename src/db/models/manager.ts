import { Sequelize, DataTypes, Model } from 'sequelize';

export class Manager extends Model {
    public id!: number;
    public user!: string;
    public communityId!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeManager(sequelize: Sequelize): void {
    return Manager.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.STRING(44),
                references: {
                    model: 'user', // name of Target model
                    key: 'address', // key in Target model that we're referencing
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            communityId: {
                type: DataTypes.UUID,
                references: {
                    model: 'community', // name of Target model
                    key: 'publicId', // key in Target model that we're referencing
                },
                onDelete: 'RESTRICT',
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
            tableName: 'manager',
            sequelize, // this bit is important
        }
    );
}
