'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('subgraph_microcredit_borrowers', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'app_user',
                    key: 'id',
                },
                onDelete: 'CASCADE'
            },
            lastRepayment: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            lastRepaymentAmount: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            lastDebt: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            amount: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            period: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            claimed: {
                type: Sequelize.INTEGER,
                allowNull: true, 
            },
            dailyInterest: {
                type: Sequelize.FLOAT,
                allowNull: true, 
            },
            repaid: {
                type: Sequelize.FLOAT,
                allowNull: true, 
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false, 
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
        return queryInterface.dropTable('subgraph_microcredit_borrowers');
    },
};
