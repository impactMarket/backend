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
            appUserTrustPhone: {
                type: Sequelize.STRING(64),
                // references: {
                //     model: 'AppUserTrust',
                //     key: 'phone',
                // },
                // onDelete: 'CASCADE',
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('AppUserThroughTrust');
    },
};
