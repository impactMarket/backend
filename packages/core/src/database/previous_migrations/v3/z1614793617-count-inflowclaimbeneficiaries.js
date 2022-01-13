'use strict';

const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });
// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        const GlobalDailyState = await queryInterface.sequelize.define(
            'globaldailystate',
            {
                date: {
                    type: Sequelize.DATEONLY,
                    primaryKey: true,
                    unique: true,
                    allowNull: false,
                },
                avgMedianSSI: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                claimed: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                claims: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                beneficiaries: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                raised: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                backers: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                volume: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                transactions: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                reach: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                reachOut: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                totalRaised: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(30), // max 999,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                totalDistributed: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(30), // max 999,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                totalBackers: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                totalBeneficiaries: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                givingRate: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                ubiRate: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                fundingRate: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                spendingRate: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                avgComulativeUbi: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(24), // max 999,999 - plus 18 decimals
                    allowNull: false,
                },
                avgUbiDuration: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                totalVolume: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(32), // max 99,999,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                totalTransactions: {
                    type: Sequelize.BIGINT, // max 9,223,372,036,854,775,807
                    allowNull: false,
                },
                totalReach: {
                    type: Sequelize.BIGINT, // max 9,223,372,036,854,775,807
                    allowNull: false,
                },
                totalReachOut: {
                    type: Sequelize.BIGINT, // max 9,223,372,036,854,775,807
                    allowNull: false,
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
            },
            {
                tableName: 'globaldailystate',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        let records;
        const dateToCount = new Date(1600859659000);
        dateToCount.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        //

        while (dateToCount <= today) {
            records = (
                await queryInterface.sequelize.query(
                    `select sum(raised) traised, sum(claimed) tclaimed, sum(beneficiaries) tbeneficiaries
            from ubi_community_daily_state cds, community c
            where c."publicId" = cds."communityId"
              and c.visibility = 'public'
              and date = '` +
                        dateToCount.toISOString().split('T')[0] +
                        "'",
                    { raw: true }
                )
            )[0];
            console.log(dateToCount.toISOString().split('T')[0], records);
            await GlobalDailyState.update(
                {
                    raised: records[0].traised,
                    claimed: records[0].tclaimed,
                    beneficiaries: records[0].tbeneficiaries,
                },
                { where: { date: dateToCount.toISOString().split('T')[0] } }
            );
            dateToCount.setDate(dateToCount.getDate() + 1);
        }
    },

    down(queryInterface, Sequelize) {},
};
