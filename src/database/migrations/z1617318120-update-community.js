'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.addColumn('community', 'logo', {
            type: Sequelize.STRING(128),
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
