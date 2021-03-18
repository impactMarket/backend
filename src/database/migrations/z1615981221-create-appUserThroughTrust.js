'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('AppUserThroughTrust', {
            userAddress: {
                type: Sequelize.STRING(44),
                references: {
                    model: 'user',
                    key: 'address',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            appUserTrustId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'AppUserTrust',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('AppUserThroughTrust');
    },
};
