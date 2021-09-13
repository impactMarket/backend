'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    //add column
    await queryInterface.addColumn('inflow', 'contractAddress', {
        type: Sequelize.STRING(44),
        allowNull: false,
        defaultValue: '0',
    });

    await queryInterface.addColumn('inflow', 'asset', {
      type: Sequelize.STRING(4),
      defaultValue: 'cUSD',
      allowNull: false,
    });

    await queryInterface.addColumn('inflow', 'value', {
      type: Sequelize.DECIMAL(29), // max 9,999,999,999 - plus 18 decimals
      allowNull: false,
      defaultValue: 0,
    });

    // populate new column
    const query = `
      UPDATE inflow
      SET "contractAddress" = community."contractAddress", "value" = "amount"
      FROM (SELECT "contractAddress", "publicId" FROM community) community
      WHERE community."publicId" = "communityId"`;

    await queryInterface.sequelize.query(query, {
      raw: true,
      type: Sequelize.QueryTypes.UPDATE,
    });

    // remove old column
    await queryInterface.removeColumn(
      'inflow',
      'communityId'
    );
  },

  down: async (queryInterface, Sequelize) => {}
};
