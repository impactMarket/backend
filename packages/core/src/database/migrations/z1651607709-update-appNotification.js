'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.removeColumn('app_notification', 'params');
        await queryInterface.addColumn('app_notification', 'params', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
