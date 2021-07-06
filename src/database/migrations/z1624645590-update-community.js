'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('community', 'review', {
            type: Sequelize.ENUM('pending', 'in-progress', 'halted', 'closed'),
            allowNull: false,
            defaultValue: 'pending',
        });
    },

    down(queryInterface, Sequelize) {},
};
