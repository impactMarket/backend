'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('learn_and_earn_user_lesson', 'createdAt', {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Date.now()
        });
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
