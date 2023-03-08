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
            description: {
                type: Sequelize.STRING(1024),
                allowNull: false,
            },
            type: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            fee: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            min: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            address: {
                type: Sequelize.STRING(256),
                allowNull: false,
            },
            phone: {
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
