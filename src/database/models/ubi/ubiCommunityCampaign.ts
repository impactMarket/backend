import {
    UbiCommunityCampaign,
    UbiCommunityCampaignCreation,
} from '@interfaces/ubi/ubiCommunityCampaign';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiCommunityCampaignModel extends Model<
    UbiCommunityCampaign,
    UbiCommunityCampaignCreation
> {
    public communityId!: number;
    public campaignUrl!: string;
}

export function initializeUbiCommunityCampaign(sequelize: Sequelize): void {
    UbiCommunityCampaignModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
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
            campaignUrl: {
                type: DataTypes.STRING(128),
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_community_campaign',
            timestamps: false,
            sequelize,
        }
    );
}
