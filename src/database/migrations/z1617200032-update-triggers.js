'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // use datagrip for better understanding + highlight

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_beneficiaries_community_states()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN -- beneficiary being added to a community
            -- update overall state
            UPDATE ubi_community_state SET beneficiaries = beneficiaries + 1 WHERE "communityId"=NEW."communityId";
            -- update daily state
            UPDATE communitydailystate SET beneficiaries = beneficiaries + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        ELSEIF (OLD.active IS TRUE AND NEW.active IS FALSE) THEN -- beneficiary being removed from community
            -- update overall state
            UPDATE ubi_community_state SET beneficiaries = beneficiaries - 1, "removedBeneficiaries" = "removedBeneficiaries" + 1 WHERE "communityId"=NEW."communityId";
            -- update daily state
            UPDATE communitydailystate SET beneficiaries = beneficiaries - 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;`);

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_claim_states()
    RETURNS TRIGGER AS $$
    declare
        state_claimed numeric(29);
        state_daily_claimed numeric(29);
        beneficiary_last_claim_at timestamp with time zone;
    BEGIN
        -- update claims
        UPDATE ubi_community_state SET claims = claims + 1 WHERE "communityId"=NEW."communityId";
        UPDATE communitydailystate SET claims = claims + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        -- update beneficiary table as well
        SELECT "lastClaimAt" INTO beneficiary_last_claim_at FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claims = claims + 1, "penultimateClaimAt"=beneficiary_last_claim_at, "lastClaimAt"=NEW."txAt" WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        -- update total claimed
        SELECT SUM(claimed + NEW.amount) INTO state_claimed FROM ubi_community_state WHERE "communityId"=NEW."communityId";
        UPDATE ubi_community_state SET claimed = state_claimed WHERE "communityId"=NEW."communityId";
        SELECT SUM(claimed + NEW.amount) INTO state_daily_claimed FROM communitydailystate WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        UPDATE communitydailystate SET claimed = state_daily_claimed WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        return NEW;
    END;
$$ LANGUAGE plpgsql;`);

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_managers_community_state()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN -- INSERT operations
            -- update overall state
            UPDATE ubi_community_state SET managers = managers + 1 WHERE "communityId"=NEW."communityId";
            RETURN NEW;
        ELSEIF (TG_OP = 'DELETE') THEN -- DELETE operations
            -- update overall state
            UPDATE ubi_community_state SET managers = managers - 1 WHERE "communityId"=OLD."communityId";
            RETURN OLD;
        END IF;
    END;
$$ LANGUAGE plpgsql;`);
    },

    down(queryInterface, Sequelize) {},
};
