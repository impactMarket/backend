'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('user', 'suspect', {
            type: Sequelize.BOLLEAN,
            defaultValue: false,
            allowNull: false,
        });
    },

    down(queryInterface, Sequelize) {},
};
