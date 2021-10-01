'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('app_user_device', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userAddress: {
                type: Sequelize.STRING(44),
                references: {
                    model: 'app_user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
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
            `ALTER TABLE app_user_device ADD CONSTRAINT one_user_per_device_key UNIQUE ("userAddress", phone, identifier, device, network);`
        );
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('app_user_device');
    },
};
