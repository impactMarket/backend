'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('app_user', 'phone', {
            type: Sequelize.STRING(64),
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
