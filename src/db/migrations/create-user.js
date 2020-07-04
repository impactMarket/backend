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
            currency: {
                type: Sequelize.STRING(4),
            },
            authToken: {
                type: Sequelize.STRING(128),
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