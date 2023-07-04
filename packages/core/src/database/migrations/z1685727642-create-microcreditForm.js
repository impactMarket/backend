'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('microcredit_form', {
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
            form: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            prismicId: {
                type: Sequelize.STRING(32),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'submitted', 'in-review', 'approved', 'rejected'),
                allowNull: false,
                defaultValue: 'pending'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('microcredit_form');
    }
};
