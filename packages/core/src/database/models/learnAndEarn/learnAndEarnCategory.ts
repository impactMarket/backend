import { DataTypes, Model, Sequelize } from 'sequelize';

import {
    LearnAndEarnCategory,
    LearnAndEarnCategoryCreation
} from '../../../interfaces/learnAndEarn/learnAndEarnCategory';

export class LearnAndEarnCategoryModel extends Model<LearnAndEarnCategory, LearnAndEarnCategoryCreation> {
    public id!: number;
    public prismicId!: string;
    public languages?: string[];
    public active!: boolean;
}

export function initializeLearnAndEarnCategory(sequelize: Sequelize): typeof LearnAndEarnCategoryModel {
    LearnAndEarnCategoryModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            prismicId: {
                type: DataTypes.STRING(32),
                allowNull: false
            },
            languages: {
                type: DataTypes.ARRAY(DataTypes.STRING(3)),
                allowNull: true
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            }
        },
        {
            tableName: 'learn_and_earn_category',
            modelName: 'learnAndEarnCategory',
            timestamps: false,
            sequelize
        }
    );
    return LearnAndEarnCategoryModel;
}
