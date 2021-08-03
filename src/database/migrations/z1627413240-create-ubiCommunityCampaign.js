'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('ubi_community_campaign', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            campaignUrl: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('ubi_community_campaign');
    },
};
