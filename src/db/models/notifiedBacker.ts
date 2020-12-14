import { Sequelize, DataTypes, Model } from 'sequelize';

interface NotifiedBackerAttributes {
    id: number;
    backer: string;
    communityId: string;
    at: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
};
interface NotifiedBackerCreationAttributes {
    backer: string;
    communityId: string;
    at: Date;
};
export class NotifiedBacker extends Model<NotifiedBackerAttributes, NotifiedBackerCreationAttributes> {
    public id!: number;
    public backer!: string;
    public communityId!: string;
    public at!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeNotifiedBacker(sequelize: Sequelize): void {
    NotifiedBacker.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            backer: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            communityId: {
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
            },
        },
        {
            tableName: 'notifiedbacker',
            sequelize,
        }
    );
}
