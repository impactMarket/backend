'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn(
                'community', // table name
                'currency', // new field name
                {
                    type: Sequelize.STRING(4),
                    defaultValue: 'USD',
                    allowNull: false,
                },
            ),
            queryInterface.addColumn(
                'community',
                'descriptionEn',
                {
                    type: Sequelize.STRING(1024),
                    allowNull: true,
                },
            ),
            queryInterface.addColumn(
                'community',
                'language',
                {
                    type: Sequelize.STRING(8),
                    defaultValue: 'en',
                    allowNull: false,
                },
            ),
        ]);
    },

    down(queryInterface, Sequelize) {
        // logic for reverting the changes
        return Promise.all([
            queryInterface.removeColumn('community', 'currency'),
            queryInterface.removeColumn('community', 'descriptionEn'),
            queryInterface.removeColumn('community', 'language'),
        ]);
    },
};
