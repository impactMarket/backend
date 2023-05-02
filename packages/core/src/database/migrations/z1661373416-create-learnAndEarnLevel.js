'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('learn_and_earn_level', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            prismicId: {
                type: Sequelize.STRING(32),
                allowNull: true,
            },
            categoryId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'learn_and_earn_category',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: true,
            },
            totalReward: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
                allowNull: false,
            },
            languages: {
                type: Sequelize.ARRAY(Sequelize.STRING(4)),
                allowNull: true,
            },
            active: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            adminUserId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'app_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM(
                    'pending',
                    'aproved',
                    'declined',
                    'published'
                ),
                allowNull: false,
                defaultValue: 'pending',
            },
            isLive: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            rewardLimit: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('learn_and_earn_level');
    },
};
