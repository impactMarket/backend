'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('wallet_airdrop_user', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      address: {
        type: Sequelize.STRING(44),
        allowNull: false,
      },
      index: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.STRING(32),
        allowNull: false,
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('wallet_airdrop_user');
  },
};
