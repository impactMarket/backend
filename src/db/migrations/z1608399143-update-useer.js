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
                defaultValue: true,
                allowNull: false,
            },
        );
        await queryInterface.addColumn(
            'user',
            'age',
            {
                type: Sequelize.INTEGER,
                defaultValue: true,
                allowNull: false,
            },
        );
        await queryInterface.addColumn(
            'user',
            'childs',
            {
                type: Sequelize.INTEGER,
                defaultValue: true,
                allowNull: false,
            },
        );
    },

    down(queryInterface, Sequelize) {
    },
};
