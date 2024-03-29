import { DataTypes, Model, Sequelize } from 'sequelize';

import { DbModels } from '../../../database/db';
import { LearnAndEarnLevelModel } from './learnAndEarnLevel';
import { LearnAndEarnPayment, LearnAndEarnPaymentCreation } from '../../../interfaces/learnAndEarn/learnAndEarnPayment';

export class LearnAndEarnPaymentModel extends Model<LearnAndEarnPayment, LearnAndEarnPaymentCreation> {
    public id!: number;
    public userId!: number;
    public levelId!: number;
    public amount!: number;
    public signature!: string;
    public status!: 'pending' | 'paid';
    public tx!: string | null;
    public txAt!: Date | null;

    public level?: LearnAndEarnLevelModel;
}

export function initializeLearnAndEarnPayment(sequelize: Sequelize): typeof LearnAndEarnPaymentModel {
    const { appUser, learnAndEarnLevel } = sequelize.models as DbModels;
    LearnAndEarnPaymentModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
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
            levelId: {
                type: DataTypes.INTEGER,
                references: {
                    model: learnAndEarnLevel,
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            amount: {
                type: DataTypes.FLOAT,
                defaultValue: 0,
                allowNull: false
            },
            signature: {
                type: DataTypes.STRING(68),
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('pending', 'paid'),
                allowNull: false,
                defaultValue: 'pending'
            },
            tx: {
                type: DataTypes.STRING(68),
                allowNull: true
            },
            txAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: 'learn_and_earn_payment',
            modelName: 'learnAndEarnPayment',
            timestamps: false,
            sequelize
        }
    );
    return LearnAndEarnPaymentModel;
}
