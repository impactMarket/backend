'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('app_anonymous_report', 'category', {
            type: Sequelize.ENUM('general'),
            allowNull: false,
            defaultValue: 'general',
        });
        await queryInterface.addColumn('app_anonymous_report', 'status', {
            type: Sequelize.ENUM('pending', 'in-progress', 'halted', 'closed'),
            allowNull: false,
            defaultValue: 'pending',
        });
    },

    down(queryInterface, Sequelize) {},
};
