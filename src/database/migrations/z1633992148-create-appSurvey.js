'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable('app_survey', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            question: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            answer: {
                type: Sequelize.STRING(128),
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('app_survey');
    },
};
