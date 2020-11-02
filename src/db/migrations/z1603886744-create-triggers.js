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
            UPDATE communitydailystate SET beneficiaries = beneficiaries + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NOW());
            return NEW;
        elseif (TG_OP = 'DELETE') THEN -- use OLD for INSERT operations
            -- update overall state
            UPDATE communitystate SET beneficiaries = beneficiaries - 1 WHERE "communityId"=NEW."communityId";
            -- update daily state
            UPDATE communitydailystate SET beneficiaries = beneficiaries - 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NOW());
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
        beneficiary_last_claim_at date;
    BEGIN
        -- update claims
        UPDATE communitystate SET claims = claims + 1 WHERE "communityId"=NEW."communityId";
        UPDATE communitydailystate SET claims = claims + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NOW());
        -- update beneficiary table as well
        SELECT "lastClaimAt" INTO beneficiary_last_claim_at FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claims = claims + 1 AND "penultimateClaimAt"=beneficiary_last_claim_at AND "lastClaimAt"=NEW."txAt" WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        -- update total claimed
        SELECT SUM(claimed + NEW.amount) INTO state_claimed FROM communitystate WHERE "communityId"=NEW."communityId";
        UPDATE communitystate SET claimed = state_claimed WHERE "communityId"=NEW."communityId";
        SELECT SUM(claimed + NEW.amount) INTO state_daily_claimed FROM communitydailystate WHERE "communityId"=NEW."communityId";
        UPDATE communitydailystate SET claimed = state_daily_claimed WHERE "communityId"=NEW."communityId" AND date=DATE(NOW());
        return NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_claim_states
AFTER INSERT
ON claim
FOR EACH ROW
EXECUTE PROCEDURE update_claim_states();`);

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_inflow_community_states()
    RETURNS TRIGGER AS $$
    declare
        state_raised numeric(29);
        state_daily_raised numeric(29);
        n_backer bigint;
        n_today_backer bigint;
    BEGIN
        -- update backers
        SELECT count(*) INTO n_backer FROM inflow WHERE "from" = NEW."from";
        -- if this address never donated, it's a new backer
        IF n_backer = 0 THEN
            UPDATE communitystate SET backers = backers + 1 WHERE "communityId"=NEW."communityId";
            UPDATE communitydailystate SET backers = backers + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NOW());
        ELSE
            -- if ever donated, let's check if already donated today
            SELECT count(*) INTO n_today_backer FROM inflow WHERE "from" = NEW."from" AND "txAt" >= now()::date + interval '0h' AND "txAt" < now()::date + interval '24h';
            IF n_today_backer = 0 THEN
                UPDATE communitydailystate SET backers = backers + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NOW());
            end if;
        end if;
        -- update total raised
        SELECT SUM(raised + NEW.amount) INTO state_raised FROM communitystate WHERE "communityId"=NEW."communityId";
        UPDATE communitystate SET raised = state_raised WHERE "communityId"=NEW."communityId";
        SELECT SUM(raised + NEW.amount) INTO state_daily_raised FROM communitydailystate WHERE "communityId"=NEW."communityId" AND date=DATE(NOW());
        UPDATE communitydailystate SET raised = state_daily_raised WHERE "communityId"=NEW."communityId" AND date=DATE(NOW());
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