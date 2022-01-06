'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        // use datagrip for better understanding + highlight

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
            UPDATE ubi_community_daily_state SET beneficiaries = beneficiaries + 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        ELSEIF (OLD.active IS TRUE AND NEW.active IS FALSE) THEN -- beneficiary being removed from community
            -- update overall state
            UPDATE ubi_community_state SET beneficiaries = beneficiaries - 1, "removedBeneficiaries" = "removedBeneficiaries" + 1 WHERE "communityId"=community_id;
            -- update daily state
            UPDATE ubi_community_daily_state SET beneficiaries = beneficiaries - 1 WHERE "communityId"=community_id AND date=DATE(NEW."txAt");
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;`);
    },

    down(queryInterface, Sequelize) {},
};
