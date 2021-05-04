'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('user', 'lastLogin', {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn('now'),
            allowNull: false,
        });
    },

    down(queryInterface, Sequelize) {},
};
