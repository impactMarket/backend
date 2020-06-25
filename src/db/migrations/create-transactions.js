'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('transactions', {
            uid: {
                type: Sequelize.STRING(64),
                primaryKey: true,
                unique: true,
            },
            tx: {
                type: Sequelize.STRING(68),
                allowNull: false,
            },
            from: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            contractAddress: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            event: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            values: {
                type: Sequelize.JSONB,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('transactions');
    }
};