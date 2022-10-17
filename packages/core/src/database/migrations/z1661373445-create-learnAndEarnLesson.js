'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('learn_and_earn_lesson', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            prismicId: {
                type: Sequelize.STRING(32),
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
            active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('learn_and_earn_lesson');
    },
};
