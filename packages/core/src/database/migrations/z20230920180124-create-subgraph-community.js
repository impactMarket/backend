'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('subgraph_ubi_community', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            communityAddress: {
                type: Sequelize.STRING,
                allowNull: false
            },
            estimatedFunds: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            claims: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            claimed: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            beneficiaries: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            removedBeneficiaries: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            contributed: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            contributors: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            managers: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            baseInterval: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            state: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            updatedAt: {
              type: Sequelize.DATE,
              allowNull: false
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('subgraph_ubi_community');
    },
};
