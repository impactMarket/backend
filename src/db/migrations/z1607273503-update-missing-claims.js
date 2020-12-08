'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        const claimsToInsert = [];
        const records = (await queryInterface.sequelize.query(`select b."communityId", t.values->>'_account' account, t.values->>'_amount' amount, t.tx, t."txAt"
        from transactions t, beneficiary b
        where t.event = 'BeneficiaryClaim'
        and t.values->>'_account' = b.address
        and t.tx not in (select tx from claim)`, { raw: true }))[0];

        for (let index = 0; index < records.length; index++) {
            claimsToInsert.push({
                address: records[index].account,
                communityId: records[index].communityId,
                amount: records[index].amount,
                tx: records[index].tx,
                txAt: records[index].txAt,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        return queryInterface.bulkInsert('claim', claimsToInsert);
    },

    down(queryInterface, Sequelize) {
    }
}