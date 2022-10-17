import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    LearnAndEarnCategory,
    LearnAndEarnCategoryCreation,
} from '../../../interfaces/learnAndEarn/learnAndEarnCategory';

export class LearnAndEarnCategoryModel extends Model<
    LearnAndEarnCategory,
    LearnAndEarnCategoryCreation
> {
    public id!: number;
    public prismicId!: string;
    public active!: boolean;
}

export function initializeLearnAndEarnCategory(
    sequelize: Sequelize
): typeof LearnAndEarnCategoryModel {
    LearnAndEarnCategoryModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            prismicId: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            tableName: 'learn_and_earn_category',
            timestamps: false,
            sequelize,
        }
    );
    return LearnAndEarnCategoryModel;
}
