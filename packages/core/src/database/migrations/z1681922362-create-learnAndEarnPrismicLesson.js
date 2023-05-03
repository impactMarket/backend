'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('learn_and_earn_prismic_lesson', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            levelId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            lessonId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            prismicId: {
                type: Sequelize.STRING(32),
                allowNull: false,
            },
            language: {
                type: Sequelize.STRING(2),
                allowNull: false,
            },
            isLive: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('learn_and_earn_prismic_lesson');
    },
};
