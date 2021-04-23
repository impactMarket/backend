'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('user', {
            address: {
                type: Sequelize.STRING(44),
                primaryKey: true,
                allowNull: false,
            },
            avatarMediaId: {
                type: Sequelize.INTEGER,
                // references: {
                //     model: 'app_media_content',
                //     key: 'id',
                // },
                // // onDelete: 'SET NULL', // default
                allowNull: true,
            },
            username: {
                type: Sequelize.STRING(128),
            },
            language: {
                type: Sequelize.STRING(8),
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(6),
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
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('user');
    },
};
