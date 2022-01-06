'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('app_anonymous_report', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: true,
            },
            message: {
                type: Sequelize.STRING(512),
                allowNull: false,
            },
            category: {
                type: Sequelize.ENUM('general', 'potential-fraud'),
                allowNull: false,
                defaultValue: 'general',
            },
            review: {
                type: Sequelize.ENUM(
                    'pending',
                    'in-progress',
                    'halted',
                    'closed'
                ),
                allowNull: false,
                defaultValue: 'pending',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('app_anonymous_report');
    },
};
