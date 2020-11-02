import { Sequelize, DataTypes, Model } from 'sequelize';


export class CronJobExecuted extends Model {
    public id!: number;
    public jobName!: string;
    public lastExecuted!: Date;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeCronJobExecuted(sequelize: Sequelize): void {
    return CronJobExecuted.init({
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        jobName: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        lastExecuted: {
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
        }
    }, {
        tableName: 'cronjobexecuted',
        sequelize: sequelize, // this bit is important
    });
}