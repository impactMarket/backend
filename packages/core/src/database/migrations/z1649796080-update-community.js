'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.changeColumn(
            'community',
            'review',
            {
              type: Sequelize.TEXT,
            },
        );

        await queryInterface.sequelize.query('drop type enum_community_review;');
        await queryInterface.changeColumn(
            'community',
            'review',
            {
                type: Sequelize.ENUM(
                    'pending',
                    'claimed',
                    'declined',
                ),
                default: 'pending',
                allowNull: false,
            },
        );
    },

    down(queryInterface, Sequelize) {},
};
