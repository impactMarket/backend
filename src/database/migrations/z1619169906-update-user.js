'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.changeColumn('user', 'currency', {
            type: Sequelize.STRING(6),
            defaultValue: 'USD',
        });
    },

    down(queryInterface, Sequelize) {},
};
