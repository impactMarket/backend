'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const startDate = '2021-06-30';
        const today = (new Date()).toISOString().split('T')[0];
        await queryInterface.sequelize.query(
            `update ubi_community_daily_state
            set volume = TOTAL.volume,
                transactions = TOTAL.txs
            from (
                SELECT COALESCE(sum(beneficiarytransaction.amount), 0) volume, count(beneficiarytransaction.tx) txs, community.id, date
                from beneficiarytransaction
                    inner join beneficiary on beneficiary.address = beneficiarytransaction.beneficiary
                        inner join community on community."publicId" = beneficiary."communityId"
                where date BETWEEN '${startDate}' and '${today}'
                group by community.id, date
            ) as TOTAL
            WHERE "communityId" = TOTAL.id and ubi_community_daily_state.date = TOTAL.date`
        );
    },

    down(queryInterface, Sequelize) {},
};
