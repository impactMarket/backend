'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('microcredit_borrowers', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            performance: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            lastNotificationRepayment: {
                type: Sequelize.DATE
            },
            manager: {
                allowNull: false,
                type: Sequelize.STRING(48)
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('microcredit_borrowers');
    }
};
