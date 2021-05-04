'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        // use datagrip for better understanding + highlight

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
BEFORE INSERT OR UPDATE
ON beneficiary
FOR EACH ROW
EXECUTE PROCEDURE update_beneficiaries_community_states();`);

        await queryInterface.sequelize.query(`
        DROP TRIGGER update_claim_states ON claim;

        CREATE OR REPLACE FUNCTION update_claim_states()
    RETURNS TRIGGER AS $$
    declare
        state_claimed numeric(29);
        state_daily_claimed numeric(29);
        beneficiary_claimed numeric(22);
        beneficiary_last_claim_at timestamp with time zone;
        community_id integer;
    BEGIN
        SELECT id INTO community_id FROM community where "publicId"=NEW."communityId";
        -- update claims
        UPDATE ubi_community_state SET claims = claims + 1 WHERE "communityId"=community_id;
        UPDATE ubi_community_daily_state SET claims = claims + 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        -- update beneficiary table as well
        SELECT "lastClaimAt" INTO beneficiary_last_claim_at FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claims = claims + 1, "penultimateClaimAt"=beneficiary_last_claim_at, "lastClaimAt"=NEW."txAt" WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        SELECT SUM(claimed + NEW.amount) INTO beneficiary_claimed FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claimed = beneficiary_claimed WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        -- update total claimed
        SELECT SUM(claimed + NEW.amount) INTO state_claimed FROM ubi_community_state WHERE "communityId"=community_id;
        UPDATE ubi_community_state SET claimed = state_claimed WHERE "communityId"=community_id;
        SELECT SUM(claimed + NEW.amount) INTO state_daily_claimed FROM ubi_community_daily_state WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        UPDATE ubi_community_daily_state SET claimed = state_daily_claimed WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        return NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_claim_states
BEFORE INSERT
ON claim
FOR EACH ROW
EXECUTE PROCEDURE update_claim_states();`);

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_managers_community_state()
    RETURNS TRIGGER AS
$$
declare
    community_id integer;
BEGIN
    SELECT id INTO community_id FROM community where "publicId" = NEW."communityId";
    IF (TG_OP = 'INSERT') THEN -- INSERT operations
    -- update overall state
        UPDATE ubi_community_state SET managers = managers + 1 WHERE "communityId" = community_id;
    ELSEIF (OLD.active IS TRUE AND NEW.active IS FALSE) THEN -- manager being removed from community
    -- update overall state
        UPDATE ubi_community_state SET managers = managers - 1 WHERE "communityId" = community_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_managers_community_state
BEFORE INSERT OR UPDATE
ON manager
FOR EACH ROW
EXECUTE PROCEDURE update_managers_community_state();`);
    },

    down(queryInterface, Sequelize) {},
};
