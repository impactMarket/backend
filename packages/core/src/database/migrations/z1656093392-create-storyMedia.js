'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('story_media', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        storyMediaPath: {
            type: Sequelize.STRING(44),
            allowNull: false,
        },
        contentId: {
            type: Sequelize.INTEGER,
            references: {
                model: 'story_content',
                key: 'id',
            },
            onDelete: 'CASCADE',
            allowNull: false,
        },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('story_media');
  },
};
