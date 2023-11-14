'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('learn_and_earn_user_lesson', 'createdAt', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.sequelize.query(`
          UPDATE learn_and_earn_user_lesson
          SET "createdAt" = COALESCE("completionDate", CURRENT_DATE);
        `);

        await queryInterface.changeColumn('learn_and_earn_user_lesson', 'createdAt', {
          type: Sequelize.DATE,
          allowNull: false
        });
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
