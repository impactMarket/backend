'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.changeColumn(
            'ubi_community_daily_state',
            'createdAt',
            {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
            }
        );
        await queryInterface.changeColumn(
            'ubi_community_daily_state',
            'updatedAt',
            {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
            }
        );
    },

    down(queryInterface, Sequelize) {},
};
