'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('app_user_validation_code', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            type: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            code: {
                type: Sequelize.STRING(9),
                allowNull: false,
            },
            expiresAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('app_user_validation_code');
    },
};
