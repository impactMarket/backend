import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    LearnAndEarnUserCategory,
    LearnAndEarnUserCategoryCreation,
} from '../../../interfaces/learnAndEarn/learnAndEarnUserCategory';

export class LearnAndEarnUserCategoryModel extends Model<
    LearnAndEarnUserCategory,
    LearnAndEarnUserCategoryCreation
> {
    public id!: number;
    public userId!: number;
    public categoryId!: number;
    public status!: 'available' | 'started' | 'completed';
    public completionDate!: Date;
}

export function initializeLearnAndEarnUserCategory(
    sequelize: Sequelize
): typeof LearnAndEarnUserCategoryModel {
    LearnAndEarnUserCategoryModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'app_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            categoryId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'learn_and_earn_category',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('available', 'started', 'completed'),
                allowNull: false,
                defaultValue: 'available',
            },
            completionDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: 'learn_and_earn_user_category',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnUserCategoryModel;
}
