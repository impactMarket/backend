'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('ubi_community_contract', 'blocked', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
        await queryInterface.addColumn('ubi_community_contract', 'decreaseStep', {
            type: Sequelize.DECIMAL(22), // max 9,999 - plus 18 decimals
            allowNull: false,
            defaultValue: 0,
        });
    },

    down(queryInterface, Sequelize) {},
};
