'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await queryInterface.sequelize.query('insert into story_media ("contentId", "storyMediaPath") (select id, "storyMediaPath" from story_content where "storyMediaPath" is not null);');
  },
  down: (queryInterface, Sequelize) => {},
};
