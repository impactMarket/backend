'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('app_user', 'readBeneficiaryRules', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        await queryInterface.addColumn('app_user', 'readManagerRules', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    down(queryInterface, Sequelize) {},
};
