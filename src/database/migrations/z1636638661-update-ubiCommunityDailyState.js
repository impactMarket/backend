'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    
    await queryInterface.addColumn('ubi_community_daily_state', 'totalClaimed', {
        type: Sequelize.DECIMAL(29),
        allowNull: false,
        defaultValue: 0
    });

    await queryInterface.addColumn('ubi_community_daily_state', 'totalRaised', {
      type: Sequelize.DECIMAL(29),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('ubi_community_daily_state', 'totalBeneficiaries', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('ubi_community_daily_state', 'totalManagers', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down(queryInterface, Sequelize) {},
};
