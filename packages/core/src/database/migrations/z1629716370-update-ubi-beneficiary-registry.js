'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.changeColumn(
            'ubi_beneficiary_registry',
            'address',
            {
                type: Sequelize.STRING(44),
                allowNull: false,
            }
        );
        await queryInterface.changeColumn('ubi_beneficiary_registry', 'from', {
            type: Sequelize.STRING(44),
            allowNull: false,
        });
        await queryInterface.removeConstraint(
            'ubi_beneficiary_registry',
            'ubi_beneficiary_registry_address_fkey'
        );
        await queryInterface.removeConstraint(
            'ubi_beneficiary_registry',
            'ubi_beneficiary_registry_from_fkey'
        );
    },

    down(queryInterface, Sequelize) {},
};
