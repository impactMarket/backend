'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('StoriesContent', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            media: {
                type: Sequelize.STRING(128),
                allowNull: true,
            },
            message: {
                type: Sequelize.STRING(256),
                allowNull: true,
            },
            postedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('StoriesContent');
    },
};
