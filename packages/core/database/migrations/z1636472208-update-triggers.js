'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_inflow_community_states()
    RETURNS TRIGGER AS $$
    declare
        n_backer bigint;
        community_id integer;
    BEGIN
        SELECT id INTO community_id FROM community where "contractAddress"=NEW."contractAddress";
        
        IF community_id is null THEN
			return new;
		end if;
        -- if this address never donated, it's a new backer
        SELECT count(*) INTO n_backer FROM inflow WHERE "from" = NEW."from" AND "contractAddress"=NEW."contractAddress";
        IF n_backer = 0 THEN
            UPDATE ubi_community_state SET backers = backers + 1 WHERE "communityId"=community_id;
        end if;
        return NEW;
    END;
$$ LANGUAGE plpgsql;`);

        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_claim_states()
    RETURNS TRIGGER AS $$
    declare
        beneficiary_claimed numeric(22);
        beneficiary_last_claim_at timestamp with time zone;
        community_public_id uuid;
    BEGIN
        SELECT "publicId" INTO community_public_id FROM community where id=NEW."communityId";
        -- update beneficiary table as well
        SELECT "lastClaimAt" INTO beneficiary_last_claim_at FROM beneficiary WHERE "communityId"=community_public_id AND address=NEW.address;
        UPDATE beneficiary SET claims = claims + 1, "penultimateClaimAt"=beneficiary_last_claim_at, "lastClaimAt"=NEW."txAt" WHERE "communityId"=community_public_id AND address=NEW.address;
        SELECT SUM(claimed + NEW.amount) INTO beneficiary_claimed FROM beneficiary WHERE "communityId"=community_public_id AND address=NEW.address;
        UPDATE beneficiary SET claimed = beneficiary_claimed WHERE "communityId"=community_public_id AND address=NEW.address;
        return NEW;
    END;
$$ LANGUAGE plpgsql;`);

        await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS update_managers_community_state ON manager`);
        await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS update_beneficiaries_community_states ON beneficiary`);
    },

    down(queryInterface, Sequelize) {},
};