'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('learn_and_earn_level', 'asset', {
            type: Sequelize.STRING(44),
            allowNull: true
        });
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
