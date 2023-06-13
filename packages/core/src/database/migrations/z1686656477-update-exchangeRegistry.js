'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('exchange_registry', 'website', {
            type: Sequelize.STRING(128),
            allowNull: true
        });
    },
    down: (queryInterface) => {},
};
