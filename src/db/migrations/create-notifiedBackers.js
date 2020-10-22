'use strict';
// eslint-disable-next-line no-undef
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('notifiedbackers', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            backer: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            community: {
                type: Sequelize.STRING(44),
                allowNull: false,
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
        return queryInterface.dropTable('notifiedbackers');
    }
};