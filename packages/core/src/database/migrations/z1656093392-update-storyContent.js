'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await queryInterface.addColumn('story_content', 'storyMedia', {
        type: Sequelize.ARRAY(Sequelize.STRING(44)),
        allowNull: true,
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('story_content', 'storyMedia');
  },
};
