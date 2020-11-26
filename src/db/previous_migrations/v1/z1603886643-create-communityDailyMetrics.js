'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('communitydailymetrics', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            communityId: {
                type: Sequelize.UUID,
                references: {
                    model: 'community', // name of Target model
                    key: 'publicId', // key in Target model that we're referencing
                },
                onDelete: 'RESTRICT',
                allowNull: false
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
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('communitydailymetrics');
    }
};