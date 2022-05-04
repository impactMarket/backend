'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('app_user', 'bio', {
            type: Sequelize.STRING(512),
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
