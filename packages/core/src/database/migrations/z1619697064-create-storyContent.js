'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('story_content', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            mediaMediaId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'app_media_content',
                    key: 'id',
                },
                // onDelete: 'SET NULL', // default
                allowNull: true,
            },
            storyMediaPath: {
                type: Sequelize.STRING(44),
                allowNull: true,
            },
            message: {
                type: Sequelize.STRING(256),
                allowNull: true,
            },
            byAddress: {
                type: Sequelize.STRING(44),
                references: {
                    model: 'app_user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            isPublic: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            postedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('story_content');
    },
};
