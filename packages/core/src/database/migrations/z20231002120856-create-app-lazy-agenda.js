'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('app_lazy_agenda', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            type: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            details: {
                type: Sequelize.JSON,
                allowNull: true
            },
            frequency: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            lastExecutedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('app_lazy_agenda');
    }
};
