'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('learn_and_earn_level', 'lessons', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        });
        await queryInterface.addColumn('learn_and_earn_level', 'client', {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
            allowNull: false,
            defaultValue: [1]
        });
    },
    down: (queryInterface) => {},
};
