'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('user', 'year', {
            type: Sequelize.INTEGER,
        });
        return queryInterface.addColumn('user', 'children', {
            type: Sequelize.INTEGER,
        });
    },

    down(queryInterface, Sequelize) {},
};
