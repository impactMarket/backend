import { DataTypes, Model, Sequelize } from 'sequelize';

import { AppLazyAgenda, AppLazyAgendaCreation } from '../../../interfaces/app/appLazyAgenda';
import { AppUserModel } from './appUser';
import { DbModels } from '../../../database/db';

export class AppLazyAgendaModel extends Model<AppLazyAgenda, AppLazyAgendaCreation> {
    public id!: number;
    public userId!: number;
    public type!: number;
    public details!: object;
    public frequency!: number;
    public lastExecutedAt!: Date;

    public readonly user?: AppUserModel;
}

export function initializeAppLazyAgenda(sequelize: Sequelize): typeof AppLazyAgendaModel {
    const { appUser } = sequelize.models as DbModels;
    AppLazyAgendaModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: appUser,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            type: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            details: {
                type: DataTypes.JSON,
                allowNull: true
            },
            frequency: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            lastExecutedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        },
        {
            tableName: 'app_lazy_agenda',
            modelName: 'appLazyAgenda',
            sequelize,
            timestamps: false
        }
    );
    return AppLazyAgendaModel;
}
