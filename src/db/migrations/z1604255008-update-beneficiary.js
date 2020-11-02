'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn(
                'beneficiary', // table name
                'claims', // new field name
                {
                    type: Sequelize.INTEGER,
                    defaultValue: 0,
                    allowNull: false,
                },
            ),
            queryInterface.addColumn(
                'beneficiary',
                'lastClaimAt',
                {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
            ),
            queryInterface.addColumn(
                'beneficiary',
                'penultimateClaimAt',
                {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
            ),
        ]);
    },
    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('beneficiary', 'claims'),
            queryInterface.removeColumn('beneficiary', 'lastClaimAt'),
            queryInterface.removeColumn('beneficiary', 'penultimateClaimAt'),
        ]);
    }
};