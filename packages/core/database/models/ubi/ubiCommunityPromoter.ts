import {
    UbiCommunityPromoter,
    UbiCommunityPromoterCreation,
} from '../../../interfaces/ubi/ubiCommunityPromoter';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiCommunityPromoterModel extends Model<
    UbiCommunityPromoter,
    UbiCommunityPromoterCreation
> {
    public promoterId!: number;
    public communityId!: number;
}

export function initializeUbiCommunityPromoter(sequelize: Sequelize): void {
    UbiCommunityPromoterModel.init(
        {
            promoterId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'ubi_promoter',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_community_promoter',
            timestamps: false,
            sequelize,
        }
    );
}
