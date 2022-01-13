'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        // use datagrip for better understanding + highlight

        return queryInterface.sequelize.query(`
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
$$ LANGUAGE plpgsql;`);
    },

    down(queryInterface, Sequelize) {},
};
