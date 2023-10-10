'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('microcredit_applications', 'signedOn', {
            allowNull: true,
            type: Sequelize.DATE
        });

        await queryInterface.addColumn('microcredit_applications', 'claimedOn', {
            allowNull: true,
            type: Sequelize.DATE
        });
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
