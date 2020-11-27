'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        // use datagrip for better understanding + highlight

        // create trigger to update total beneficiaries ina  given community, by day and since ever
        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_beneficiaries_community_states()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (NEW.active IS TRUE) THEN
            -- update overall state
            UPDATE communitystate SET beneficiaries = beneficiaries + 1 WHERE "communityId"=NEW."communityId";
            -- update daily state
            UPDATE communitydailystate SET beneficiaries = beneficiaries + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        ELSE
            -- update overall state
            UPDATE communitystate SET beneficiaries = beneficiaries - 1 WHERE "communityId"=NEW."communityId";
            -- update daily state
            UPDATE communitydailystate SET beneficiaries = beneficiaries - 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

DROP TRIGGER update_beneficiaries_community_states ON beneficiary;

CREATE TRIGGER update_beneficiaries_community_states
AFTER INSERT OR UPDATE
ON beneficiary
FOR EACH ROW
EXECUTE PROCEDURE update_beneficiaries_community_states();`);

    },

    down(queryInterface, Sequelize) {
    }
}