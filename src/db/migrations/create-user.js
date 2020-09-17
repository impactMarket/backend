'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('user', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: Sequelize.STRING(44),
                allowNull: false
            },
            username: {
                type: Sequelize.STRING(64),
            },
            avatar: {
                type: Sequelize.STRING(128),
            },
            language: {
                type: Sequelize.INTEGER, // TODO:  Sequelize.STRING(8),
                // TODO: add default value
            },
            currency: {
                type: Sequelize.STRING(4),
            },
            pushNotificationToken: {
                type: Sequelize.STRING(64),
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('user');
    }
};