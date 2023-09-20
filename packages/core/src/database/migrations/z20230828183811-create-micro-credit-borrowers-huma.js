'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('microcredit_borrowers_huma', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            humaRWRReferenceId: {
                allowNull: false,
                type: Sequelize.STRING(64)
            },
            repaid: {
                allowNull: false,
                type: Sequelize.BOOLEAN,
                defaultValue: false
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('microcredit_borrowers_huma');
    }
};
