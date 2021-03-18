'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        // use datagrip for better understanding + highlight

        return queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_claim_states()
    RETURNS TRIGGER AS $$
    declare
        beneficiary_claimed numeric(22);
        state_claimed numeric(29);
        state_daily_claimed numeric(29);
        beneficiary_last_claim_at timestamp with time zone;
    BEGIN
        -- update claims
        UPDATE communitystate SET claims = claims + 1 WHERE "communityId"=NEW."communityId";
        UPDATE communitydailystate SET claims = claims + 1 WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        -- update beneficiary table as well
        SELECT "lastClaimAt", SUM(claimed + NEW.amount) INTO beneficiary_last_claim_at, beneficiary_claimed FROM beneficiary WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        UPDATE beneficiary SET claims = claims + 1, "penultimateClaimAt"=beneficiary_last_claim_at, "lastClaimAt"=NEW."txAt", claimed = beneficiary_claimed WHERE "communityId"=NEW."communityId" AND address=NEW.address;
        -- update total claimed
        SELECT SUM(claimed + NEW.amount) INTO state_claimed FROM communitystate WHERE "communityId"=NEW."communityId";
        UPDATE communitystate SET claimed = state_claimed WHERE "communityId"=NEW."communityId";
        SELECT SUM(claimed + NEW.amount) INTO state_daily_claimed FROM communitydailystate WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        UPDATE communitydailystate SET claimed = state_daily_claimed WHERE "communityId"=NEW."communityId" AND date=DATE(NEW."txAt");
        return NEW;
    END;
$$ LANGUAGE plpgsql;`);
    },

    down(queryInterface, Sequelize) {},
};
