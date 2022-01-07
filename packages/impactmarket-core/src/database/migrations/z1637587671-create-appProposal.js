'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('app_proposal', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            endBlock: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('app_proposal');
    },
};
