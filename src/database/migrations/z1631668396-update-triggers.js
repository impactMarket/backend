'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        
        await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_inflow_community_states()
    RETURNS TRIGGER AS $$
    declare
        state_raised numeric(29);
        -- state_daily_raised numeric(29);
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
