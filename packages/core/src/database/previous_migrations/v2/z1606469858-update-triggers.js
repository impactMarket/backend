'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        // use datagrip for better understanding + highlight

        // create trigger to update total beneficiaries ina  given community, by day and since ever
        await queryInterface.sequelize.query(`
        DROP TRIGGER update_beneficiaries_community_states ON beneficiary;
        
        CREATE OR REPLACE FUNCTION update_beneficiaries_community_states()
    RETURNS TRIGGER AS $$
    declare
        community_id integer;
    BEGIN
        SELECT id INTO community_id FROM community where "publicId"=NEW."communityId";
        IF (TG_OP = 'INSERT') THEN -- INSERT operations (first added)
            -- update overall state
            UPDATE ubi_community_state SET beneficiaries = beneficiaries + 1 WHERE "communityId"=community_id;
            -- update daily state
            UPDATE ubi_community_daily_state SET beneficiaries = beneficiaries + 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        ELSEIF (OLD.active IS FALSE AND NEW.active IS TRUE) THEN -- beneficiary being added back to community
            -- update overall state
            UPDATE ubi_community_state SET beneficiaries = beneficiaries + 1, "removedBeneficiaries" = "removedBeneficiaries" - 1 WHERE "communityId"=community_id;
            -- update daily state
            UPDATE ubi_community_daily_state SET beneficiaries = beneficiaries + 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        ELSEIF (OLD.active IS TRUE AND NEW.active IS FALSE) THEN -- beneficiary being removed from community
            -- update overall state
            UPDATE ubi_community_state SET beneficiaries = beneficiaries - 1, "removedBeneficiaries" = "removedBeneficiaries" + 1 WHERE "communityId"=community_id;
            -- update daily state
            UPDATE ubi_community_daily_state SET beneficiaries = beneficiaries - 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_beneficiaries_community_states
AFTER INSERT OR UPDATE
ON beneficiary
FOR EACH ROW
EXECUTE PROCEDURE update_beneficiaries_community_states();`);
    },

    down(queryInterface, Sequelize) {},
};
