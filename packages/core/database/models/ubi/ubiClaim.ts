import { UbiClaim, UbiClaimCreation } from '../../../interfaces/ubi/ubiClaim';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiClaimModel extends Model<UbiClaim, UbiClaimCreation> {
    public id!: number;
    public address!: string;
    public communityId!: number;
    public amount!: string;
    public tx!: string;
    public txAt!: Date;
}

export function initializeUbiClaim(sequelize: Sequelize): void {
    UbiClaimModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: DataTypes.STRING(44),
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
            amount: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(24), // max 999,999 - plus 18 decimals
                allowNull: false,
            },
            tx: {
                type: DataTypes.STRING(68),
                unique: true,
                allowNull: false,
            },
            txAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_claim',
            timestamps: false,
            sequelize,
        }
    );
}
