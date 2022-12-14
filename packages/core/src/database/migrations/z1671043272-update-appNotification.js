'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('app_notification', 'isWallet', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            default: false,
        });

        await queryInterface.addColumn('app_notification', 'isWebApp', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            default: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
