'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('story_comment', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
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
            comment: {
                type: Sequelize.STRING(256),
                allowNull: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('story_comment');
    },
};
