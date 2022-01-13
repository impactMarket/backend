'use strict';

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

        const dateToCount = new Date('2021-06-30');
        dateToCount.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        while (dateToCount <= today) {
            const totals = (
                await queryInterface.sequelize.query(
                    `select COALESCE(sum(transactions.amount), 0) volume, count(transactions.tx) txs from (
                        select distinct beneficiarytransaction.amount, beneficiarytransaction.tx
                        from beneficiarytransaction
                        inner join beneficiary on beneficiary.address = beneficiarytransaction.beneficiary
                                inner join community on community."publicId" = beneficiary."communityId"
                         where community.visibility = 'public' and date <= '${dateToCount.toISOString().split('T')[0]}'
                    ) as transactions`,
                    {
                        type: Sequelize.QueryTypes.SELECT,
                    }
                )
            )[0];

            const individual = (
                await queryInterface.sequelize.query(
                    `select COALESCE(sum(transactions.amount), 0) volume, count(transactions.tx) txs from (
                        select distinct beneficiarytransaction.amount, beneficiarytransaction.tx
                        from beneficiarytransaction
                        inner join beneficiary on beneficiary.address = beneficiarytransaction.beneficiary
                                inner join community on community."publicId" = beneficiary."communityId"
                         where community.visibility = 'public' and date = '${dateToCount.toISOString().split('T')[0]}'
                         ) as transactions`,
                    {
                        type: Sequelize.QueryTypes.SELECT,
                    }
                )
            )[0];

            await GlobalDailyState.update(
                {
                    totalVolume: totals.volume,
                    totalTransactions: totals.txs,
                    volume: individual.volume,
                    transactions: individual.txs,
                },
                { where: { date: dateToCount.toISOString().split('T')[0] } }
            );

            dateToCount.setDate(dateToCount.getDate() + 1);
        }
    },

    down(queryInterface, Sequelize) {},
};
