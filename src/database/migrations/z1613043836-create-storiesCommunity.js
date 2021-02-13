'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('StoriesCommunity', {
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
            communityId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'RESTRICT',
                allowNull: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('StoriesCommunity');
    },
};
