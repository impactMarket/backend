'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable('app_notification', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: Sequelize.STRING(44),
                references: {
                    model: 'user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            type: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            params: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            read: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('app_notification');
    },
};
