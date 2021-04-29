'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('story_engagement', {
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
            loves: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('story_engagement');
    },
};
