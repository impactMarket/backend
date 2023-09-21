'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('app_cico_provider', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            description: {
                type: Sequelize.STRING(256),
                allowNull: false
            },
            countries: {
                type: Sequelize.ARRAY(Sequelize.STRING(2)),
                allowNull: false
            },
            type: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            isCashin: {
                type: Sequelize.BOOLEAN,
                allowNull: false
            },
            isCashout: {
                type: Sequelize.BOOLEAN,
                allowNull: false
            },
            details: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('app_cico_provider');
    }
};
