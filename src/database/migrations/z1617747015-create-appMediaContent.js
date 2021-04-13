'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('app_media_content', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            url: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
            width: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            height: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('app_media_content');
    },
};
