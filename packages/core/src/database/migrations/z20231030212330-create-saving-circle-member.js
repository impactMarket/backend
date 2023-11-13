'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('saving_circle_member', {
            id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              autoIncrement: true,
              primaryKey: true
            },
            userId: {
              type: Sequelize.INTEGER,
              references: {
                model: 'app_user',
                key: 'id',
              },
              onDelete: 'CASCADE',
              allowNull: false,
            },
            groupId: {
              type: Sequelize.INTEGER,
              references: {
                  model: 'saving_circle',
                  key: 'id',
              },
              onDelete: 'CASCADE',
              allowNull: false,
            },
            accept: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            decisionOn: {
              type: Sequelize.DATE,
              allowNull: true,
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
        return queryInterface.dropTable('saving_circle_member');
    },
};
