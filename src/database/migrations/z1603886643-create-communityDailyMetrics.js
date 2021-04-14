'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('ubi_community_daily_metrics', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
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
            ssiDayAlone: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            ssi: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            ubiRate: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            estimatedDuration: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
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
        return queryInterface.dropTable('ubi_community_daily_metrics');
    },
};
