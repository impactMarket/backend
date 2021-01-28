import { Sequelize, DataTypes, Model } from 'sequelize';

export class SSI extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public communityPublicId!: number;
    public date!: Date;
    public ssi!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeSSI(sequelize: Sequelize): void {
    SSI.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityPublicId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            ssi: {
                type: DataTypes.FLOAT,
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
            tableName: 'ssi',
            sequelize, // this bit is important
        }
    );
}
