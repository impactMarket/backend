'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('learn_and_earn_level', 'rewardLimit', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
