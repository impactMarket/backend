'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.changeColumn('microcredit_borrowers', 'userId', {
            allowNull: false,
            type: Sequelize.INTEGER,
            unique: true
        });
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
