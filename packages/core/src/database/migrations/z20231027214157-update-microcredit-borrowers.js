'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('microcredit_borrowers', 'repaymentRate', {
            allowNull: true,
            type: Sequelize.INTEGER
        });
        await queryInterface.addColumn('microcredit_borrowers', 'applicationId', {
            allowNull: true,
            type: Sequelize.INTEGER
        });
        await queryInterface.changeColumn('microcredit_borrowers', 'manager', {
            allowNull: true,
            type: Sequelize.STRING(48)
        });
        await queryInterface.changeColumn('microcredit_borrowers', 'performance', {
            allowNull: false,
            type: Sequelize.INTEGER,
            defaultValue: 100
        });
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
