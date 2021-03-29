'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('ubi_community_organization', {
            id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'ubi_organization',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
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
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('ubi_community_organization');
    },
};
