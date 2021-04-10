'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('story_content', 'media');
        await queryInterface.addColumn('story_content', 'mediaMediaId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'app_media_content',
                key: 'id',
            },
            // onDelete: 'SET NULL', // default
            allowNull: true,
        });
    },
    down: (queryInterface) => {},
};
