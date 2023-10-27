'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        // execute only after 2023-10-25
        if (new Date().getTime() < new Date('2023-10-25T00:00:00.000Z').getTime()) {
            throw new Error('Migration can be executed only after 2023-10-25');
        }

        await queryInterface.removeColumn('learn_and_earn_level', 'prismicId');
        await queryInterface.removeColumn('learn_and_earn_level', 'categoryId');
        await queryInterface.removeColumn('learn_and_earn_level', 'languages');
        await queryInterface.removeColumn('learn_and_earn_level', 'active');
        await queryInterface.removeColumn('learn_and_earn_level', 'isLive');
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
