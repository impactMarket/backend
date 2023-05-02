'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        // add new columns
        await queryInterface.addColumn('learn_and_earn_user_lesson', 'levelId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'learn_and_earn_level',
                key: 'id',
            },
            onDelete: 'CASCADE',
            allowNull: true,
        });

        await queryInterface.removeConstraint('learn_and_earn_user_lesson', 'learn_and_earn_user_lesson_lessonId_fkey');

        // set old columns as optional
        await queryInterface.changeColumn('learn_and_earn_user_lesson', 'lessonId', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
    },
    down: (queryInterface) => {},
};
