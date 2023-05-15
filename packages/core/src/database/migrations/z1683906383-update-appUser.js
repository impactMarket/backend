'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('app_user', 'emailValidated', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn('app_user', 'phoneValidated', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
    },
    down: (queryInterface) => {},
};
