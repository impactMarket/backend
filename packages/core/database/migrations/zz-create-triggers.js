'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // use datagrip for better understanding + highlight

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_claim_states()
    RETURNS TRIGGER AS $$
    declare
        beneficiary_claimed numeric(22);
        beneficiary_last_claim_at timestamp with time zone;
    BEGIN
        -- update beneficiary table
        SELECT "lastClaimAt" INTO beneficiary_last_claim_at FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claims = claims + 1, "penultimateClaimAt"=beneficiary_last_claim_at, "lastClaimAt"=NEW."txAt" WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        SELECT SUM(claimed + NEW.amount) INTO beneficiary_claimed FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claimed = beneficiary_claimed WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        return NEW;
    END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_claim_states
BEFORE INSERT
ON ubi_claim
FOR EACH ROW
EXECUTE PROCEDURE update_claim_states();`);

        return queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_loves_stories()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN -- INSERT operations
            UPDATE story_engagement SET loves = loves + 1 WHERE "contentId"=NEW."contentId";
            RETURN NEW;
        ELSEIF (TG_OP = 'DELETE') THEN -- DELETE operations
            UPDATE story_engagement SET loves = loves - 1 WHERE "contentId"=OLD."contentId";
            RETURN OLD;
        END IF;
    END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_loves_stories
BEFORE INSERT OR DELETE
ON story_user_engagement
FOR EACH ROW
EXECUTE PROCEDURE update_loves_stories();`);
    },

    down(queryInterface, Sequelize) {},
};