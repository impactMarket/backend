'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // use datagrip for better understanding + highlight

        return queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_loves_stories()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN -- INSERT operations
            UPDATE "StoryEngagement" SET loves = loves + 1 WHERE "contentId"=NEW."contentId";
            RETURN NEW;
        ELSEIF (TG_OP = 'DELETE') THEN -- DELETE operations
            UPDATE "StoryEngagement" SET loves = loves - 1 WHERE "contentId"=OLD."contentId";
            RETURN OLD;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loves_stories
BEFORE INSERT OR DELETE
ON "StoryUserEngagement"
FOR EACH ROW
EXECUTE PROCEDURE update_loves_stories();`);
    },

    down(queryInterface, Sequelize) {},
};
