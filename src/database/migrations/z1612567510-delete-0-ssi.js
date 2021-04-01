'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.sequelize.query(
            'delete from ubi_community_daily_metrics where ssi = 0'
        );
    },

    down(queryInterface, Sequelize) {},
};
