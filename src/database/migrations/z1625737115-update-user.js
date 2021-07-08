'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.changeColumn('user', 'language', {
            type: Sequelize.STRING(8),
            defaultValue: 'en',
            allowNull: false,
        });
    },

    down(queryInterface, Sequelize) {},
};
