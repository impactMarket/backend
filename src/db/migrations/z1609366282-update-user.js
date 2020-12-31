'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'user',
            'year',
            {
                type: Sequelize.INTEGER,
            },
        );
        return queryInterface.addColumn(
            'user',
            'children',
            {
                type: Sequelize.INTEGER,
            },
        );
    },

    down(queryInterface, Sequelize) {
    },
};
