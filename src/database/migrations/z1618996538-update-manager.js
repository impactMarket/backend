'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.renameColumn('manager', 'user', 'address');
        await queryInterface.addColumn('manager', 'active', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
