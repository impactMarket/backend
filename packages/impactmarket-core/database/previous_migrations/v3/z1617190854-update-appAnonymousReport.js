'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        return queryInterface.addColumn('app_anonymous_report', 'createdAt', {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
        });
    },

    down(queryInterface, Sequelize) {},
};
