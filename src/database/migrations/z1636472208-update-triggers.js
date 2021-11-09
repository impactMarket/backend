'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_claim_states ON ubi_claim');
        await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_inflow_community_states ON inflow');
    },

    down(queryInterface, Sequelize) {},
};
