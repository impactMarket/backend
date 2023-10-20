'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('subgraph_ubi_beneficiary', {
            id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              autoIncrement: true,
              primaryKey: true
            },
            userAddress: {
              type: Sequelize.STRING,
              allowNull: false
            },
            communityAddress: {
              type: Sequelize.STRING,
              allowNull: false
            },
            since: {
              type: Sequelize.INTEGER,
            },
            claimed: {
              type: Sequelize.FLOAT,
            },
            state: {
              type: Sequelize.INTEGER,
            },
            updatedAt: {
              type: Sequelize.DATE,
              allowNull: false
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('subgraph_ubi_beneficiary');
    },
};
