'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('ubi_community_contract', {
            communityId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                unique: true,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            claimAmount: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            maxClaim: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            maxTranche: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            minTranche: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            baseInterval: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            incrementInterval: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            decreaseStep: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            blocked: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
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
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('ubi_community_contract');
    },
};
