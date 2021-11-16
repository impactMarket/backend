'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const communities = (await queryInterface.sequelize.query(`
      select "communityId"
      from ubi_community_daily_state
      group by "communityId";
    `, { raw: true }))[0];

    // update the first day of each community
    for(let i = 0; i < communities.length; i++) {
      //update totalClaimed, totalRaised, totalBeneficiaries
      await queryInterface.sequelize.query(`
        update ubi_community_daily_state 
        set "totalClaimed" = claimed,
            "totalRaised" = raised,
            "totalBeneficiaries" = beneficiaries
        where date = (select date
            from ubi_community_daily_state
            where "communityId" = ${communities[i].communityId}
            order by date
            limit 1
          ) and "communityId" = ${communities[i].communityId};
      `);
    }

    // update all others by day
    const startDate = new Date('2020-09-22');
    startDate.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    while (startDate <= today) {
      const query = `
        update ubi_community_daily_state
        set "totalClaimed" = previous."totalClaimed" + today.claimed,
            "totalRaised" = previous."totalRaised" + today.raised,
            "totalBeneficiaries" = previous."totalBeneficiaries" + today.beneficiaries
        from (
          select distinct on ("communityId") "communityId", "totalClaimed", "totalRaised", "totalBeneficiaries"
          from ubi_community_daily_state
          where date < '${startDate.toISOString().split('T')[0]}'
          order by "communityId", date DESC
        ) as previous,
        (select claimed, raised, beneficiaries, "communityId" from ubi_community_daily_state where date = '${startDate.toISOString().split('T')[0]}') as today
        where ubi_community_daily_state."communityId" = previous."communityId"
          and ubi_community_daily_state."communityId" = today."communityId"
          and ubi_community_daily_state.date = '${startDate.toISOString().split('T')[0]}';
      `;

      await queryInterface.sequelize.query(query);

      startDate.setDate(startDate.getDate() + 1);
    }
  },

  down(queryInterface, Sequelize) {},
};
