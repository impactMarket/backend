'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const lastState = (await queryInterface.sequelize.query(
      `select date from ubi_community_daily_state order by date DESC limit 1`,
      { raw: true, type: Sequelize.QueryTypes.SELECT }
    ))[0];

    await queryInterface.sequelize.query(`
      update ubi_community_daily_state 
      set "totalManagers" = state.managers
      from (select managers, "communityId" from ubi_community_state) as state
      where date = '${lastState.date}' and ubi_community_daily_state."communityId" = state."communityId";
    `);
  },

  down(queryInterface, Sequelize) {},
};
