'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await queryInterface.sequelize.query(`
    UPDATE story_content
    SET "storyMedia" = ARRAY[story."storyMediaPath"]
    FROM (SELECT id, "storyMediaPath" FROM story_content WHERE "storyMediaPath" is not null) as story
    WHERE story.id = story_content.id;`);
  },
  down: (queryInterface, Sequelize) => {},
};
