import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    UbiPromoter,
    UbiPromoterCreation,
} from '../../../interfaces/ubi/ubiPromoter';

export class UbiPromoterModel extends Model<UbiPromoter, UbiPromoterCreation> {
    public id!: number;
    public category!: 'organization' | 'company' | 'individual';
    public name!: string;
    public description!: string;
    public logoMediaPath!: string;
}

export function initializeUbiPromoter(sequelize: Sequelize): void {
    UbiPromoterModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            category: {
                type: DataTypes.ENUM('organization', 'company', 'individual'),
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING(512),
                allowNull: false,
            },
            logoMediaPath: {
                type: DataTypes.STRING(44),
                // onDelete: 'SET NULL', // default
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_promoter',
            timestamps: false,
            sequelize,
        }
    );
}
