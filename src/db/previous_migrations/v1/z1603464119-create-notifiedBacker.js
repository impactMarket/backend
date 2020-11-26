'use strict';
// eslint-disable-next-line no-undef
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('notifiedbacker', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            backer: {
                type: Sequelize.STRING(44),
                allowNull: false,
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
            at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('notifiedbacker');
    }
};