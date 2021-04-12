'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        let queryResults;

        //

        queryResults = (
            await queryInterface.sequelize.query(
                `select * from beneficiarytransaction
                where beneficiary in (select "contractAddress" from community)
                and tx not in (select tx from inflow)`,
                { raw: true }
            )
        )[0];
        for (let index = 0; index < queryResults.length; index++) {
            const e = queryResults[index];
            const community = (
                await queryInterface.sequelize.query(
                    `select "publicId" from community where "contractAddress" = '${e.beneficiary}'`,
                    { raw: true }
                )
            )[0];
            await queryInterface.sequelize.query(
                `insert into inflow ("from", "communityId", amount, tx, "txAt", "createdAt", "updatedAt")
                        values('${e.withAddress}','${
                    community[0].publicId
                }', CAST('${e.amount}' AS DECIMAL), '${
                    e.tx
                }', '${e.createdAt.toISOString()}', now(), now())`
            );
        }

        await queryInterface.sequelize.query(
            `delete from beneficiarytransaction where beneficiary in (select "contractAddress" from community)`
        );

        await queryInterface.sequelize.query(
            `delete from beneficiarytransaction where "withAddress" in (select "contractAddress" from community)`
        );

        // update numbers using triggers
        await queryInterface.sequelize.query(
            `update beneficiary set active = false where address in (select "contractAddress" from community)`
        );
    },

    down(queryInterface, Sequelize) {},
};
