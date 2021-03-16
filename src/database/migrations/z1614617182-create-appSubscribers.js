'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('AppSubscribers', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            email: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('AppSubscribers');
    },
};
