'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('learn_and_earn_payment', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'app_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            levelId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'learn_and_earn_level',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            amount: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
                allowNull: false,
            },
            tx: {
                type: Sequelize.STRING(68),
                allowNull: false,
            },
            txAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('learn_and_earn_payment');
    },
};
