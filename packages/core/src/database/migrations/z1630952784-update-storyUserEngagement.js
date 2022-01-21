'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.changeColumn('story_user_engagement', 'address', {
            type: Sequelize.STRING(44),
            references: {
                model: 'user',
                key: 'address',
            },
            onDelete: 'CASCADE',
            allowNull: false,
        });
    },

    down(queryInterface, Sequelize) {},
};