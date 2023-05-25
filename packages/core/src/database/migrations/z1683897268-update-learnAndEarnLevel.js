'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('learn_and_earn_level', 'rules', {
            type: Sequelize.JSONB,
            allowNull: true,
        });
    },
    down: (queryInterface) => {},
};
