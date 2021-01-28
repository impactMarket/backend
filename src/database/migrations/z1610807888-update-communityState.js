'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'communitystate',
            'removedBeneficiaries',
            {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        );
        return queryInterface.addColumn(
            'communitystate',
            'managers',
            {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        );
    },

    down(queryInterface, Sequelize) {
    },
};
