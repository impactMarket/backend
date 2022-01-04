'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('ubi_community_suspect', {
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
            percentage: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            suspect: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATEONLY,
                defaultValue: Sequelize.fn('now'),
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('ubi_community_suspect');
    },
};
