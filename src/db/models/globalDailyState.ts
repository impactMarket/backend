import { Sequelize, DataTypes, Model } from 'sequelize';

export class GlobalDailyState extends Model {
    public date!: Date;
    public avgMedianSSI!: number;
    public claimed!: string;
    public claims!: number;
    public beneficiaries!: number;
    public raised!: string;
    public backers!: number;
    public volume!: string;
    public transactions!: number;
    public reach!: number;
    public totalRaised!: string;
    public totalDistributed!: string;
    public totalBackers!: number;
    public totalBeneficiaries!: number;
    public givingRate!: number;
    public ubiRate!: number;
    public fundingRate!: number;
    public spendingRate!: number;
    public avgComulativeUbi!: string;
    public avgUbiDuration!: number;
    public totalVolume!: string;
    // NOTE: Number.MAX_SAFE_INTEGER in js is
    // 9007199254740992 and BIGINT in postgres is
    // 9223372036854775807
    public totalTransactions!: BigInt;
    public totalReach!: BigInt;
    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeGlobalDailyState(sequelize: Sequelize): void {
    return GlobalDailyState.init(
        {
            date: {
                type: DataTypes.DATEONLY,
                primaryKey: true,
                unique: true,
                allowNull: false,
            },
            avgMedianSSI: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            claimed: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            claims: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            beneficiaries: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            raised: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            backers: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            volume: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            transactions: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            reach: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            totalRaised: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(30), // max 999,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            totalDistributed: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(30), // max 999,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            totalBackers: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            totalBeneficiaries: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            givingRate: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            ubiRate: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            fundingRate: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            spendingRate: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            avgComulativeUbi: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(24), // max 999,999 - plus 18 decimals
                allowNull: false,
            },
            avgUbiDuration: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            totalVolume: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: DataTypes.DECIMAL(32), // max 99,999,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            totalTransactions: {
                type: DataTypes.BIGINT, // max 9,223,372,036,854,775,807
                allowNull: false,
            },
            totalReach: {
                type: DataTypes.BIGINT, // max 9,223,372,036,854,775,807
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'globaldailystate',
            sequelize: sequelize, // this bit is important
        }
    );
}
