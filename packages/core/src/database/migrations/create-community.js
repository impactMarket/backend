'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('community', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            requestByAddress: {
                type: Sequelize.STRING(44),
                unique: true,
                allowNull: false,
            },
            contractAddress: {
                type: Sequelize.STRING(44),
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING(1024),
                allowNull: false,
            },
            language: {
                type: Sequelize.STRING(8),
                defaultValue: 'en',
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(4),
                defaultValue: 'USD',
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
            email: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            visibility: {
                type: Sequelize.ENUM('public', 'private'),
                allowNull: false,
            },
            coverMediaPath: {
                type: Sequelize.STRING(44),
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('pending', 'valid', 'removed'),
                allowNull: false,
            },
            review: {
                type: Sequelize.ENUM(
                    'pending',
                    'in-progress',
                    'halted',
                    'closed'
                ),
                default: 'pending',
                allowNull: false,
            },
            started: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            proposalId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            ambassadorAddress: {
                type: Sequelize.STRING(44),
                allowNull: true,
            },
            placeId: {
                type: Sequelize.STRING(44),
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
            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('community');
    },
};
