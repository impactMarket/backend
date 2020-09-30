'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.changeColumn(
                'user', // table name
                'address', // new field name
                {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                    unique: true
                },
            ),
        ]);
    },

    down(queryInterface, Sequelize) {
    },
};
