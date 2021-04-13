'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('app_media_thumbnail', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            mediaContentId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'app_media_content',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
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
            pixelRatio: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('app_media_thumbnail');
    },
};
