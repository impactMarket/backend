'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.removeColumn('merchant_registry', 'city');

        await queryInterface.addColumn('merchant_registry', 'description', {
            type: Sequelize.STRING(1024),
            allowNull: false,
        });
        await queryInterface.addColumn('merchant_registry', 'type', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
        await queryInterface.addColumn('merchant_registry', 'fee', {
            type: Sequelize.FLOAT,
            allowNull: false,
        });
        await queryInterface.addColumn('merchant_registry', 'min', {
            type: Sequelize.FLOAT,
            allowNull: false,
        });
        await queryInterface.addColumn('merchant_registry', 'address', {
            type: Sequelize.STRING(256),
            allowNull: false,
        });
        await queryInterface.addColumn('merchant_registry', 'phone', {
            type: Sequelize.STRING(64),
            allowNull: false,
        });
    },

    down(queryInterface, Sequelize) {},
};