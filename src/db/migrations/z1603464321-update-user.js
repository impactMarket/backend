'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('user', 'id'),
            queryInterface.addConstraint('user', {
                fields: ['address'],
                type: 'primary key',
            }),
            queryInterface.removeConstraint('user', 'user_address_key'),
        ]);
    },

    down(queryInterface, Sequelize) {
    },
};
