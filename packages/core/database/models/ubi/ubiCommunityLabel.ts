import {
    UbiCommunityLabel,
    UbiCommunityLabelCreation,
} from '../../../interfaces/ubi/ubiCommunityLabel';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiCommunityLabelModel extends Model<
    UbiCommunityLabel,
    UbiCommunityLabelCreation
> {
    public communityId!: string;
    public name!: string;
    public description!: string;
    public logo!: string;
    public website!: string;
    public facebook!: string;
}

export function initializeUbiCommunityLabel(sequelize: Sequelize): void {
    UbiCommunityLabelModel.init(
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
            label: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_community_label',
            timestamps: false,
            sequelize,
        }
    );
}
