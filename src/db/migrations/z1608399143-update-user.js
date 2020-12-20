'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'user',
            'avatar',
        );
        await queryInterface.addColumn(
            'user',
            'gender',
            {
                type: Sequelize.STRING(2),
            },
        );
        await queryInterface.addColumn(
            'user',
            'age',
            {
                type: Sequelize.INTEGER,
            },
        );
        return queryInterface.addColumn(
            'user',
            'childs',
            {
                type: Sequelize.INTEGER,
            },
        );
    },

    down(queryInterface, Sequelize) {
    },
};
