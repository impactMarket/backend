'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.addColumn(
            'mobileerror', // table name
            'version', // new field name
            {
                type: Sequelize.STRING(8),
                allowNull: true,
            },
        );
    },

    down(queryInterface, Sequelize) {
    },
};
