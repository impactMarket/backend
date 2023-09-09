'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('app_user', 'clientId', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },
    down: (queryInterface) => {},
};
