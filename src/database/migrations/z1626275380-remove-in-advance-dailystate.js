'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query(
            'DELETE FROM ubi_community_daily_state where date >= date(now())'
        );
    },

    down(queryInterface, Sequelize) {},
};
