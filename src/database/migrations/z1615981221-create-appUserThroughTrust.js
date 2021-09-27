'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('app_user_through_trust', {
            userAddress: {
                type: Sequelize.STRING(44),
                references: {
                    model: 'app_user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            appUserTrustId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'app_user_trust',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('app_user_through_trust');
    },
};
