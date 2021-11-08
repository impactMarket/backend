'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    await queryInterface.addColumn('community', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
    });
  },

  down(queryInterface, Sequelize) {},
};
