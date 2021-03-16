'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('AppUserDevice', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
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
                type: Sequelize.STRING(64),
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
            network: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            lastLogin: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
        return queryInterface.sequelize.query(
            `ALTER TABLE "AppUserDevice" ADD CONSTRAINT one_user_per_device_key UNIQUE ("userAddress", phone, identifier, device, network);`
        );
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('AppUserDevice');
    },
};
