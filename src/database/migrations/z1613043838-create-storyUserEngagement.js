'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('StoryUserEngagement', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            contentId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'StoryContent',
                    key: 'id',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            address: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
        });
        return queryInterface.sequelize.query(
            `ALTER TABLE StoryUserEngagement ADD CONSTRAINT one_love_per_story_key UNIQUE ("contentId", address);`
        );
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('StoryUserEngagement');
    },
};
