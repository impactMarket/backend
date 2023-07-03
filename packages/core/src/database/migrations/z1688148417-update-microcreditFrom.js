'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('microcredit_form', 'status', {
            type: Sequelize.ENUM('pending', 'submitted', 'in-review', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        });

        await queryInterface.addColumn('microcredit_form', 'prismicId', {
            type: Sequelize.STRING(32),
            allowNull: false,
        });

        await queryInterface.removeColumn('microcredit_form', 'submitted');
    },
    down: (queryInterface) => {},
};
