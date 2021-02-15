'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('StoriesEngagement', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            contentId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'StoriesContent',
                    key: 'id',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            love: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('StoriesEngagement');
    },
};
