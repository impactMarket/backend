'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('story_user_engagement', {
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
            address: {
                type: Sequelize.STRING(44),
                references: {
                    model: 'app_user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
        });
        try {
            await queryInterface.sequelize.query(
                `alter table story_user_engagement drop constraint one_love_per_story_key;`
            );
        } catch (e) {}
        return queryInterface.sequelize.query(
            `ALTER TABLE story_user_engagement ADD CONSTRAINT one_love_per_story_key UNIQUE ("contentId", address);`
        );
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('story_user_engagement');
    },
};
