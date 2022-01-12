import {
    UbiPromoter,
    UbiPromoterCreation,
} from '../../../interfaces/ubi/ubiPromoter';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiPromoterModel extends Model<UbiPromoter, UbiPromoterCreation> {
    public id!: number;
    public category!: 'organization' | 'company' | 'individual';
    public name!: string;
    public description!: string;
    public logoMediaId!: number;
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
            logoMediaId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'app_media_content',
                    key: 'id',
                },
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
