'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('merchant_registry', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            city: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            country: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            gps: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            cashout: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            payment: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('merchant_registry');
    },
};
