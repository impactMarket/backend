'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('beneficiary', 'blocked', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
