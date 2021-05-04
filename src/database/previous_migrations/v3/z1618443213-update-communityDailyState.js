'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('ubi_community_daily_state', 'volume', {
            // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
            type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
            defaultValue: 0,
        });
        await queryInterface.addColumn(
            'ubi_community_daily_state',
            'transactions',
            {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            }
        );
        await queryInterface.addColumn('ubi_community_daily_state', 'reach', {
            type: Sequelize.INTEGER, // max 2,147,483,647
            defaultValue: 0,
        });
        await queryInterface.addColumn(
            'ubi_community_daily_state',
            'reachOut',
            {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            }
        );
        await queryInterface.addColumn('ubi_community_daily_state', 'ubiRate', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        });
        await queryInterface.addColumn(
            'ubi_community_daily_state',
            'fundingRate',
            {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            }
        );
    },

    down(queryInterface, Sequelize) {},
};
