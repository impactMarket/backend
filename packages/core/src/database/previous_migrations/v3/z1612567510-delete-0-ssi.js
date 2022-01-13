'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        return queryInterface.sequelize.query(
            'delete from ubi_community_daily_metrics where ssi = 0'
        );
    },

    down(queryInterface, Sequelize) {},
};
