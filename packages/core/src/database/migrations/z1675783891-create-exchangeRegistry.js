'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('exchange_registry', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            global: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            countries: {
                type: Sequelize.ARRAY(Sequelize.STRING(2)),
                allowNull: true,
            },
            customImplementation: {
                type: Sequelize.STRING(16),
                allowNull: true,
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
        return queryInterface.dropTable('exchange_registry');
    },
};
