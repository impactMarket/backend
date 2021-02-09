'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('globalgrowth', {
            date: {
                type: Sequelize.DATEONLY,
                primaryKey: true,
                unique: true,
                allowNull: false,
            },
            claimed: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            claims: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            beneficiaries: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            raised: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            backers: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            fundingRate: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            volume: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            transactions: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            reach: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            reachOut: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('globalgrowth');
    },
};
