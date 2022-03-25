'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('app_user', 'firstName', {
            type: Sequelize.STRING(128),
            allowNull: true,
        });
        await queryInterface.addColumn('app_user', 'lastName', {
            type: Sequelize.STRING(128),
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
