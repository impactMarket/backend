'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'ubi_community_state',
            'removedBeneficiaries',
            {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            }
        );
        return queryInterface.addColumn('ubi_community_state', 'managers', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
        });
    },

    down(queryInterface, Sequelize) {},
};
