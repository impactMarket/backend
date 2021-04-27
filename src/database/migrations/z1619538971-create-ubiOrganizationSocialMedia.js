'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('ubi_organization_social_media', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            organizationId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'ubi_organization',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            mediaType: {
                type: Sequelize.STRING(32),
                allowNull: true,
            },
            url: {
                type: Sequelize.STRING(128),
                allowNull: true,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('ubi_organization_social_media');
    },
};
