import { Sequelize, DataTypes, Model } from 'sequelize';

export interface MerchantCommunity {
    id: number;
    merchantId: number;
    communityId: number;
}

export interface MerchantCommunityCreationAttributes {
    merchantId: number;
    communityId: number;
}

export class MerchantCommunityModel extends Model<
    MerchantCommunity,
    MerchantCommunityCreationAttributes
> {
    public id!: number;
    public merchantId!: number;
    public communityId!: number;
}

export function initializeMerchantCommunity(
    sequelize: Sequelize
): typeof MerchantCommunityModel {
    MerchantCommunityModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            merchantId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'merchant_registry',
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
            tableName: 'merchant_community',
            timestamps: false,
            sequelize,
        }
    );
    return MerchantCommunityModel;
}
