'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('microcredit_loan_manager', 'fundsSource', {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
            defaultValue: [0],
            allowNull: false
        });
    },
    down: (queryInterface) => {},
};
