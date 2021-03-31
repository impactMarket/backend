'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.addColumn('app_anonymous_report', 'createdAt', {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
        });
    },

    down(queryInterface, Sequelize) {},
};
