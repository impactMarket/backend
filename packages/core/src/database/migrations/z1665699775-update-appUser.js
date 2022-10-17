'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('app_user', 'walletPNT', {
            type: Sequelize.STRING(256),
            allowNull: true,
        });

        await queryInterface.addColumn('app_user', 'appPNT', {
            type: Sequelize.STRING(256),
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
