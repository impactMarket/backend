'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.sequelize.query(
            'delete from communitydailymetrics where ssi = 0'
        );
    },

    down(queryInterface, Sequelize) {},
};
