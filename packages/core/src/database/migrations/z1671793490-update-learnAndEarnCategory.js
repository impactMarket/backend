'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('learn_and_earn_category', 'languages', {
            type: Sequelize.ARRAY(Sequelize.STRING(4)),
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
