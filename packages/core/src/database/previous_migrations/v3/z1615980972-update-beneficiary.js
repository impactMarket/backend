'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('beneficiary', 'blocked', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn('beneficiary', 'claimed', {
            type: Sequelize.DECIMAL(22), // max 9,999 - plus 18 decimals
            defaultValue: 0,
        });
    },

    down(queryInterface, Sequelize) {},
};
