'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('AppAnonymousReport', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: Sequelize.UUID,
                references: {
                    model: 'community',
                    key: 'publicId',
                },
                onDelete: 'RESTRICT',
                allowNull: true,
            },
            message: {
                type: Sequelize.STRING(512),
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('AppAnonymousReport');
    },
};
