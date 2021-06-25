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
                type: Sequelize.UUID,
                references: {
                    model: 'community',
                    key: 'publicId',
                },
                onDelete: 'RESTRICT',
                allowNull: true,
            },
            message: {
                type: Sequelize.STRING(512),
                allowNull: false,
            },
            category: {
                type: Sequelize.ENUM('general'),
                allowNull: false,
                defaultValue: 'general',
            },
            status: {
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
                type: Sequelize.DATEONLY,
                defaultValue: Sequelize.fn('now'),
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('app_anonymous_report');
    },
};
