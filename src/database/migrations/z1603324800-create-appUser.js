'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('app_user', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: Sequelize.STRING(44),
                allowNull: false,
                unique: true,
            },
            avatarMediaId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            username: {
                type: Sequelize.STRING(128),
            },
            language: {
                type: Sequelize.STRING(8),
                defaultValue: 'en',
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(4),
                defaultValue: 'USD',
            },
            pushNotificationToken: {
                type: Sequelize.STRING(64),
            },
            gender: {
                type: Sequelize.STRING(2),
            },
            year: {
                type: Sequelize.INTEGER,
            },
            children: {
                type: Sequelize.INTEGER,
            },
            lastLogin: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
                allowNull: false,
            },
            suspect: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(64),
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            deletedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('app_user');
    },
};
