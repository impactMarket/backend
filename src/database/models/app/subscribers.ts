import { Sequelize, DataTypes, Model } from 'sequelize';

interface Subscribers {
    id: number;
    email: string;
}
export interface SubscribersCreation {
    email: string;
}
export class SubscribersModel extends Model<Subscribers, SubscribersCreation> {
    public id!: number;
    public email!: string;
}

export function initializeSubscribers(sequelize: Sequelize): void {
    SubscribersModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING(44),
                allowNull: false,
            },
        },
        {
            tableName: 'AppSubscribers',
            timestamps: false,
            sequelize,
        }
    );
}
