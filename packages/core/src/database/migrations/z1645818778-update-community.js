'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.changeColumn('community', 'coverMediaId', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('community', 'coverMediaPath', {
            type: Sequelize.STRING(44),
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
