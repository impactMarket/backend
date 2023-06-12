'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('app_referral_code', {
            code: {
                type: Sequelize.STRING(12),
                primaryKey: true,
                unique: true,
            },
            campaignId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('app_referral_code');
    },
};
