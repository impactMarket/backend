'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('StoryUserReport', {
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
                onDelete: 'CASCADE',
                allowNull: false,
            },
            address: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
        });
        return queryInterface.sequelize.query(
            `ALTER TABLE "StoryUserReport" ADD CONSTRAINT one_report_per_story_key UNIQUE ("contentId", address);`
        );
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('StoryUserReport');
    },
};
