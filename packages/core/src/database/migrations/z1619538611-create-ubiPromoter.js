'use strict';
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('ubi_promoter', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            category: {
                type: Sequelize.ENUM('organization', 'company', 'individual'),
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING(512),
                allowNull: false,
            },
            logoMediaPath: {
                type: Sequelize.STRING(44),
                // onDelete: 'SET NULL', // default
                allowNull: false,
            },
        });
    },
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('ubi_promoter');
    },
};
