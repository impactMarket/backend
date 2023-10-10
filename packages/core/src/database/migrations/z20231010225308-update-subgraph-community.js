'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('subgraph_ubi_community', 'claimAmount', {
          type: Sequelize.FLOAT,
          allowNull: true,
        });
        await queryInterface.addColumn('subgraph_ubi_community', 'originalClaimAmount', {
          type: Sequelize.FLOAT,
          allowNull: true,
        });
        await queryInterface.addColumn('subgraph_ubi_community', 'maxClaim', {
          type: Sequelize.FLOAT,
          allowNull: true,
        });
    },
    down: (queryInterface) => {},
};
