import { Sequelize, DataTypes, Model } from 'sequelize';

interface ManagerAttributes {
    id: number;
    user: string;
    communityId: string;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
interface ManagerCreationAttributes {
    user: string;
    communityId: string;
}
export class Manager extends Model<
    ManagerAttributes,
    ManagerCreationAttributes
> {
    public id!: number;
    public user!: string;
    public communityId!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeManager(sequelize: Sequelize): void {
    Manager.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.STRING(44),
                references: {
                    model: sequelize.models.User,
                    key: 'address',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            communityId: {
                type: DataTypes.UUID,
                references: {
                    model: 'community',
                    key: 'publicId',
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
            sequelize,
        }
    );
}
