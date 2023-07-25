'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('microcredit_applications', 'selectedLoanManagerId', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
        await queryInterface.changeColumn('microcredit_applications', 'form', {
            type: Sequelize.JSONB,
            allowNull: true
        });
        await queryInterface.changeColumn('microcredit_applications', 'prismicId', {
            type: Sequelize.STRING(32),
            allowNull: true
        });
    },
    down: (queryInterface) => {},
};
