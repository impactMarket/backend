'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('mobileerror', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            version: {
                type: Sequelize.STRING(8),
                allowNull: true,
            },
            address: {
                type: Sequelize.STRING(44),
                allowNull: true,
            },
            action: {
                type: Sequelize.STRING(64),
                allowNull: true,
            },
            error: {
                type: Sequelize.STRING(256),
                allowNull: true,
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
        return queryInterface.dropTable('mobileerror');
    }
};