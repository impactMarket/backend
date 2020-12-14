'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('user', {
            address: {
                type: Sequelize.STRING(44),
                primaryKey: true,
                allowNull: false,
            },
            username: {
                type: Sequelize.STRING(128),
            },
            avatar: {
                type: Sequelize.STRING(128),
            },
            language: {
                type:Sequelize.STRING(8),
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(4),
                defaultValue: 'USD',
            },
            pushNotificationToken: {
                type: Sequelize.STRING(64),
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('user');
    }
};