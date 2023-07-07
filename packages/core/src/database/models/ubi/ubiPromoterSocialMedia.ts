import { DataTypes, Model, Sequelize } from 'sequelize';

import { UbiPromoterSocialMedia, UbiPromoterSocialMediaCreation } from '../../../interfaces/ubi/ubiPromoterSocialMedia';

export class UbiPromoterSocialMediaModel extends Model<UbiPromoterSocialMedia, UbiPromoterSocialMediaCreation> {
    public id!: number;
    public promoterId!: string;
    public mediaType!: string;
    public url!: string;
}

export function initializeUbiPromoterSocialMedia(sequelize: Sequelize): void {
    UbiPromoterSocialMediaModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            promoterId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'ubi_promoter',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            mediaType: {
                type: DataTypes.STRING(32),
                allowNull: true
            },
            url: {
                type: DataTypes.STRING(128),
                allowNull: true
            }
        },
        {
            tableName: 'ubi_promoter_social_media',
            modelName: 'ubiPromoterSocialMedia',
            timestamps: false,
            sequelize
        }
    );
}
