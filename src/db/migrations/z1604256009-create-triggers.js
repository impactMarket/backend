'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // use datagrip for better understanding + highlight

        // create trigger to update total beneficiaries ina  given community, by day and since ever
        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_beneficiaries_community_states()
    RETURNS TRIGGER AS $$
    BEGIN
        if (TG_OP = 'INSERT') THEN -- use NEW for INSERT operations
            -- update overall state
            UPDATE communitystate SET beneficiaries = beneficiaries + 1 WHERE "communityId"=NEW."communityId";
            -- update daily state
            UPDATE communitydailystate SET beneficiaries = beneficiaries + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
            return NEW;
        elseif (TG_OP = 'DELETE') THEN -- use OLD for DELETE operations
            -- update overall state
            UPDATE communitystate SET beneficiaries = beneficiaries - 1 WHERE "communityId"=OLD."communityId";
            -- update daily state
            UPDATE communitydailystate SET beneficiaries = beneficiaries - 1 WHERE "communityId"=OLD."communityId" AND date=DATE(OLD."txAt");
            return OLD;
        END IF;
        return NULL;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_beneficiaries_community_states
AFTER INSERT OR DELETE
ON beneficiary
FOR EACH ROW
EXECUTE PROCEDURE update_beneficiaries_community_states();`);

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_claim_states()
    RETURNS TRIGGER AS $$
    declare
        state_claimed numeric(29);
        state_daily_claimed numeric(29);
        beneficiary_last_claim_at timestamp with time zone;
    BEGIN
        -- update claims
        UPDATE communitystate SET claims = claims + 1 WHERE "communityId"=NEW."communityId";
        UPDATE communitydailystate SET claims = claims + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        -- update beneficiary table as well
        SELECT "lastClaimAt" INTO beneficiary_last_claim_at FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claims = claims + 1, "penultimateClaimAt"=beneficiary_last_claim_at, "lastClaimAt"=NEW."txAt" WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        -- update total claimed
        SELECT SUM(claimed + NEW.amount) INTO state_claimed FROM communitystate WHERE "communityId"=NEW."communityId";
        UPDATE communitystate SET claimed = state_claimed WHERE "communityId"=NEW."communityId";
        SELECT SUM(claimed + NEW.amount) INTO state_daily_claimed FROM communitydailystate WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        UPDATE communitydailystate SET claimed = state_daily_claimed WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        return NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_claim_states
AFTER INSERT
ON claim
FOR EACH ROW
EXECUTE PROCEDURE update_claim_states();`);

        return queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_inflow_community_states()
    RETURNS TRIGGER AS $$
    declare
        state_raised numeric(29);
        state_daily_raised numeric(29);
        n_backer bigint;
    BEGIN
        -- if this address never donated, it's a new backer
        SELECT count(*) INTO n_backer FROM inflow WHERE "from" = NEW."from" AND "communityId"=NEW."communityId";
        IF n_backer = 0 THEN
            UPDATE communitystate SET backers = backers + 1 WHERE "communityId"=NEW."communityId";
        end if;
        -- update total raised
        SELECT SUM(raised + NEW.amount) INTO state_raised FROM communitystate WHERE "communityId"=NEW."communityId";
        UPDATE communitystate SET raised = state_raised WHERE "communityId"=NEW."communityId";
        SELECT SUM(raised + NEW.amount) INTO state_daily_raised FROM communitydailystate WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        UPDATE communitydailystate SET raised = state_daily_raised WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        return NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inflow_community_states
BEFORE INSERT
ON inflow
FOR EACH ROW
EXECUTE PROCEDURE update_inflow_community_states();`);
    },

    down(queryInterface, Sequelize) {
    }
}