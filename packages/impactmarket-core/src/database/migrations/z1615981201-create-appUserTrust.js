'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('app_user_trust', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            phone: {
                // hashed phone number
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            verifiedPhoneNumber: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            suspect: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('app_user_trust');
    },
};
