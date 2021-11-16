'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('community', 'proposal', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
