'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.removeColumn('app_user_trust', 'suspect');
    },

    down(queryInterface, Sequelize) {},
};
