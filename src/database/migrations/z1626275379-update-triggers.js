'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        // use datagrip for better understanding + highlight

        // create trigger to update total beneficiaries ina  given community, by day and since ever
        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_beneficiaries_community_states()
    RETURNS TRIGGER AS $$
    declare
        community_id integer;
    BEGIN
        SELECT id INTO community_id FROM community where "publicId"=NEW."communityId";
        IF (TG_OP = 'INSERT') THEN -- INSERT operations (beneficiary being added from community)
            -- update overall state
            UPDATE ubi_community_state SET beneficiaries = beneficiaries + 1 WHERE "communityId"=community_id;
            -- update daily state
            -- UPDATE ubi_community_daily_state SET beneficiaries = beneficiaries + 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        ELSEIF (OLD.active IS TRUE AND NEW.active IS FALSE) THEN -- beneficiary being removed from community
            -- update overall state
            UPDATE ubi_community_state SET beneficiaries = beneficiaries - 1, "removedBeneficiaries" = "removedBeneficiaries" + 1 WHERE "communityId"=community_id;
            -- update daily state
            -- UPDATE ubi_community_daily_state SET beneficiaries = beneficiaries - 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;`);

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_claim_states()
    RETURNS TRIGGER AS $$
    declare
        state_claimed numeric(29);
        -- state_daily_claimed numeric(29);
        beneficiary_claimed numeric(22);
        beneficiary_last_claim_at timestamp with time zone;
        community_id integer;
    BEGIN
        SELECT id INTO community_id FROM community where "publicId"=NEW."communityId";
        -- update claims
        UPDATE ubi_community_state SET claims = claims + 1 WHERE "communityId"=community_id;
        -- UPDATE ubi_community_daily_state SET claims = claims + 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        -- update beneficiary table as well
        SELECT "lastClaimAt" INTO beneficiary_last_claim_at FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claims = claims + 1, "penultimateClaimAt"=beneficiary_last_claim_at, "lastClaimAt"=NEW."txAt" WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        SELECT SUM(claimed + NEW.amount) INTO beneficiary_claimed FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claimed = beneficiary_claimed WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        -- update total claimed
        SELECT SUM(claimed + NEW.amount) INTO state_claimed FROM ubi_community_state WHERE "communityId"=community_id;
        UPDATE ubi_community_state SET claimed = state_claimed WHERE "communityId"=community_id;
        -- SELECT SUM(claimed + NEW.amount) INTO state_daily_claimed FROM ubi_community_daily_state WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        -- UPDATE ubi_community_daily_state SET claimed = state_daily_claimed WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        return NEW;
    END;
$$ LANGUAGE plpgsql;`);

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_inflow_community_states()
    RETURNS TRIGGER AS $$
    declare
        state_raised numeric(29);
        -- state_daily_raised numeric(29);
        n_backer bigint;
        community_id integer;
    BEGIN
        SELECT id INTO community_id FROM community where "publicId"=NEW."communityId";
        -- if this address never donated, it's a new backer
        SELECT count(*) INTO n_backer FROM inflow WHERE "from" = NEW."from" AND "communityId"=NEW."communityId";
        IF n_backer = 0 THEN
            UPDATE ubi_community_state SET backers = backers + 1 WHERE "communityId"=community_id;
        end if;
        -- update total raised
        SELECT SUM(raised + NEW.amount) INTO state_raised FROM ubi_community_state WHERE "communityId"=community_id;
        UPDATE ubi_community_state SET raised = state_raised WHERE "communityId"=community_id;
        -- SELECT SUM(raised + NEW.amount) INTO state_daily_raised FROM ubi_community_daily_state WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        -- UPDATE ubi_community_daily_state SET raised = state_daily_raised WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        return NEW;
    END;
$$ LANGUAGE plpgsql;`);
    },

    down(queryInterface, Sequelize) {},
};
