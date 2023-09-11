'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('app_user', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: Sequelize.STRING(44),
                allowNull: false,
                unique: true,
            },
            avatarMediaPath: {
                type: Sequelize.STRING(44),
                allowNull: true,
            },
            firstName: {
                type: Sequelize.STRING(128),
            },
            lastName: {
                type: Sequelize.STRING(128),
            },
            language: {
                type: Sequelize.STRING(8),
                defaultValue: 'en',
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(4),
                defaultValue: 'USD',
            },
            walletPNT: {
                type: Sequelize.STRING(256),
            },
            appPNT: {
                type: Sequelize.STRING(256),
            },
            gender: {
                type: Sequelize.STRING(2),
            },
            year: {
                type: Sequelize.INTEGER,
            },
            children: {
                type: Sequelize.INTEGER,
            },
            lastLogin: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
                allowNull: false,
            },
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(64),
                allowNull: true,
            },
            emailValidated: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            bio: {
                type: Sequelize.STRING(512),
                allowNull: true,
            },
            country: {
                type: Sequelize.STRING(64),
                allowNull: true,
            },
            phone: {
                type: Sequelize.STRING(64),
                allowNull: true,
            },
            phoneValidated: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            readBeneficiaryRules: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            readManagerRules: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            clientId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            deletedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('app_user');
    },
};
