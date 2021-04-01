'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('ubi_organization', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING(512),
                allowNull: false,
            },
            logo: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
            website: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
            facebook: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('ubi_organization');
    },
};
