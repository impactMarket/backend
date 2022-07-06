'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('community', 'placeId', {
            type: Sequelize.STRING(44),
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
