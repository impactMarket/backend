'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn(
            'ubi_community_daily_state',
            'monthlyBackers',
            {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
            }
        );
    },

    down(queryInterface, Sequelize) {},
};
