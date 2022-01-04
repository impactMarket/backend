'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.sequelize.query(
            'DELETE FROM ubi_community_daily_state where date >= date(now())'
        );
    },

    down(queryInterface, Sequelize) {},
};
