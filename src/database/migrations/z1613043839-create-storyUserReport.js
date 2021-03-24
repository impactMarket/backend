'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('story_user_report', {
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
                allowNull: false,
            },
        });
        return queryInterface.sequelize.query(
            `ALTER TABLE story_user_report ADD CONSTRAINT one_report_per_story_key UNIQUE ("contentId", address);`
        );
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('story_user_report');
    },
};
