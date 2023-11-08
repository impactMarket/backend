'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('saving_circle', {
            id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              autoIncrement: true,
              primaryKey: true
            },
            name: {
              type: Sequelize.STRING(64),
              allowNull: false,
            },
            country: {
              type: Sequelize.STRING(2),
              allowNull: false
            },
            amount: {
              type: Sequelize.FLOAT,
              allowNull: false,
            },
            frequency: {
              type: Sequelize.INTEGER,
              allowNull: false,
            },
            firstDepositOn: {
              type: Sequelize.DATEONLY,
              allowNull: false,
            },
            requestedBy: {
              type: Sequelize.INTEGER,
              unique: true,
              references: {
                model: 'app_user',
                key: 'id',
              },
              allowNull: false,
            },
            status: {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 0,
            },
            createdAt: {
              type: Sequelize.DATE,
              allowNull: false
            },
            updatedAt: {
              type: Sequelize.DATE,
              allowNull: false
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('saving_circle');
    },
};
