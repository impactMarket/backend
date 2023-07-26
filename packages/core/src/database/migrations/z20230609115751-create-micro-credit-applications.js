'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('microcredit_applications', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'app_user',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false
            },
            form: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            selectedLoanManagerId: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            prismicId: {
                type: Sequelize.STRING(32),
                allowNull: true
            },
            amount: {
                allowNull: true,
                type: Sequelize.INTEGER
            },
            period: {
                allowNull: true,
                type: Sequelize.INTEGER
            },
            status: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            decisionOn: {
                allowNull: true,
                type: Sequelize.DATE
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('microcredit_applications');
    }
};
