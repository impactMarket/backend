'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('AppUserDevice', {
            userAddress: {
                type: Sequelize.STRING(44),
                references: {
                    model: 'user',
                    key: 'address',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            phone: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
            identifier: {
                type: Sequelize.STRING(256),
                allowNull: false,
            },
            device: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            wifi: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            lastLogin: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('AppUserDevice');
    },
};
