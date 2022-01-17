import { Sequelize, DataTypes, Model } from 'sequelize';

import {
    UbiCommunityContract,
    UbiCommunityContractCreation,
} from '../../../interfaces/ubi/ubiCommunityContract';

/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiCommunityContract:
 *        type: object
 *        required:
 *          - communityId
 *          - claimAmount
 *          - maxClaim
 *          - baseInterval
 *          - incrementInterval
 *        properties:
 *          communityId:
 *            type: integer
 *            description: The community id
 *          claimAmount:
 *            type: string
 *            description: Amount per claim, same as in contract with 18 decimals
 *          maxClaim:
 *            type: string
 *            description: Maximum claim per beneficiary, same as in contract with 18 decimals
 *          baseInterval:
 *            type: integer
 *            description: Base interval between claims
 *          incrementInterval:
 *            type: integer
 *            description: Increment interval after each claim
 */
export class UbiCommunityContractModel extends Model<
    UbiCommunityContract,
    UbiCommunityContractCreation
> {
    public communityId!: number;
    public claimAmount!: string;
    public maxClaim!: string;
    public baseInterval!: number;
    public incrementInterval!: number;
    public blocked!: boolean;
    public decreaseStep!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeUbiCommunityContract(sequelize: Sequelize): void {
    UbiCommunityContractModel.init(
        {
            communityId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                unique: true,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
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
            blocked: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            decreaseStep: {
                type: DataTypes.DECIMAL(22), // max 9,999 - plus 18 decimals
                allowNull: false,
                defaultValue: 0,
            },
            createdAt: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE,
            },
        },
        {
            tableName: 'ubi_community_contract',
            sequelize,
        }
    );
}
