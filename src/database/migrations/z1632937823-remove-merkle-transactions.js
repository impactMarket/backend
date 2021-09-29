'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const ignoredAddress = [
            "'0x24d0203ceAf0a93Ee0f17BEA275f7115959e390B'",
            "'0xaBA01981E40f50447D5Ab08bdDB957B02b800023'",
        ];

        const result = await queryInterface.sequelize.query(
            `select date from beneficiarytransaction where "withAddress" in (${ignoredAddress})
            order by date ASC
            limit 1`,
            {
                type: Sequelize.QueryTypes.SELECT,
                raw: true,
            }
        );

        const dateToCount = new Date(result[0].date);
        dateToCount.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await queryInterface.sequelize.query(`DELETE FROM beneficiarytransaction WHERE "withAddress" IN (${ignoredAddress})`);

        while (dateToCount <= today) {

            // update global daily state
            await queryInterface.sequelize.query(
                `UPDATE globaldailystate
                SET volume = TOTAL.volume,
                    transactions = TOTAL.txs
                FROM (
                    select COALESCE(sum(amount), 0) volume, count(tx) txs from beneficiarytransaction where date = '${dateToCount.toISOString().split('T')[0]}'
                ) as TOTAL
                WHERE date = '${dateToCount.toISOString().split('T')[0]}'`
            )

            // update community daily state
            await queryInterface.sequelize.query(
                `update ubi_community_daily_state 
                set volume = TOTAL.volume,
                    transactions = TOTAL.txs
                from (
                    SELECT COALESCE(sum(beneficiarytransaction.amount), 0) volume, count(beneficiarytransaction.tx) txs, community.id
                    from beneficiarytransaction 
                        inner join beneficiary on beneficiary.address = beneficiarytransaction.beneficiary
                            inner join community on community."publicId" = beneficiary."communityId" 
                    where date = '${dateToCount.toISOString().split('T')[0]}'
                    group by community.id
                ) as TOTAL
                WHERE "communityId" = TOTAL.id and date = '${dateToCount.toISOString().split('T')[0]}'`
            )

            dateToCount.setDate(dateToCount.getDate() + 1);
        }
    },

    down(queryInterface, Sequelize) {},
};
