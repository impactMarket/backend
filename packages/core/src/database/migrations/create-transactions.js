'use strict';
// eslint-disable-next-line no-undef
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('transactions', {
            uid: { // the uid is the hash of the tx values
                type: Sequelize.STRING(64),
                primaryKey: true,
                unique: true,
            },
            tx: {
                type: Sequelize.STRING(68),
                allowNull: false,
            },
            txAt: {
                type: Sequelize.DATE,
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
    down: (queryInterface) => {
        return queryInterface.dropTable('transactions');
    }
};