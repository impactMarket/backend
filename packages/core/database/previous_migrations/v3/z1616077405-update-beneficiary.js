'use strict';

const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });
// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        const r = await queryInterface.sequelize.query(
            `select COALESCE(sum(amount), 0) claimed, address, "communityId"
            from claim group by address, "communityId"`,
            { raw: true, type: Sequelize.QueryTypes.SELECT }
        );

        for (let index = 0; index < r.length; index++) {
            const e = r[index];
            await queryInterface.sequelize.query(
                `update beneficiary set claimed = cast('${e.claimed}' as decimal)
                where address = '${e.address}'
                and "communityId" = '${e.communityId}'`
            );
        }
    },

    down(queryInterface, Sequelize) {},
};
