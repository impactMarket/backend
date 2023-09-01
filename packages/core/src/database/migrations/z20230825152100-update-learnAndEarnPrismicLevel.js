'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await queryInterface.addColumn('learn_and_earn_prismic_level', 'availableAt', {
        type: Sequelize.DATE,
        allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('learn_and_earn_prismic_level', 'availableAt');
  }
};
