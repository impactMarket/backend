import { Sequelize, DataTypes, Model } from 'sequelize';


export class Community extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public walletAddress!: string;
    public name!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


export function initializeCommunity(sequelize: Sequelize)  {
    return Community.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        walletAddress: {
            type: new DataTypes.STRING(128),
            allowNull: false,
        },
        name: {
            type: new DataTypes.STRING(128),
            allowNull: false
        }
    }, {
        tableName: 'community',
        sequelize: sequelize, // this bit is important
    });
}