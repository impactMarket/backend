import {
    UbiRequestChangeParams,
    UbiRequestChangeParamsCreation,
} from '@interfaces/UBI/requestChangeParams';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiRequestChangeParamsModel extends Model<
    UbiRequestChangeParams,
    UbiRequestChangeParamsCreation
> {
    public id!: number;
    public communityId!: string;
    public claimAmount!: string;
    public maxClaim!: string;
    public baseInterval!: number;
    public incrementInterval!: number;
}

export function initializeUbiRequestChangeParams(sequelize: Sequelize): void {
    UbiRequestChangeParamsModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: DataTypes.UUID,
                references: {
                    model: 'community',
                    key: 'publicId',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            claimAmount: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(22), // max 9,999 - plus 18 decimals
                allowNull: false,
            },
            maxClaim: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(24), // max 999,999 - plus 18 decimals
                allowNull: false,
            },
            baseInterval: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            incrementInterval: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_request_changeParams',
            timestamps: false,
            sequelize,
        }
    );
}
