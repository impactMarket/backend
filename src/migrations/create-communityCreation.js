'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('communitycreation', {
            publicId: {
                type: Sequelize.UUID,
                unique: true,
                allowNull: false,
            },
            amountByClaim: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            baseInterval: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            incrementalInterval: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            claimHardcap: {
                type: Sequelize.INTEGER,
                allowNull: false,
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
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('communitycreation');
    }
};