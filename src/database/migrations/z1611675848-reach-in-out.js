'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.sequelize.query('delete from reachedaddress');

        let query;
        let queryResults;

        //

        console.log('add all reached address');
        // add all reached address
        queryResults = (
            await queryInterface.sequelize.query(
                `select "withAddress", date from beneficiarytransaction`,
                { raw: true }
            )
        )[0];
        for (let index = 0; index < queryResults.length; index++) {
            const e = queryResults[index];
            await queryInterface.sequelize.query(
                `insert into reachedaddress (address, "lastInteraction", "createdAt", "updatedAt")
                    values('${e.withAddress}','${e.date}', now(), now()) 
                    on conflict (address) do 
                    update set "lastInteraction" = '${e.date}'`
            );
        }

        //

        const firstDay = new Date('2020-09-13');
        const limitDate = new Date();
        limitDate.setHours(0, 0, 0, 0);

        console.log('reach by day');
        // query reached by day
        const reachedDate = new Date(firstDay.getTime());
        while (reachedDate.getTime() < limitDate) {
            query = `select count(distinct "withAddress") total from beneficiarytransaction where date='${
                reachedDate.toISOString().split('T')[0]
            }'`;
            queryResults = (
                await queryInterface.sequelize.query(query, { raw: true })
            )[0];
            // update table
            await queryInterface.sequelize.query(
                `update globaldailystate set reach = ${
                    queryResults[0].total
                } where date = '${reachedDate.toISOString().split('T')[0]}'`
            );
            //
            reachedDate.setDate(reachedDate.getDate() + 1);
        }

        console.log('reach out by day');
        // query reached out by day
        const reachedOutDate = new Date(firstDay.getTime());
        while (reachedOutDate.getTime() < limitDate) {
            query = `select count(distinct "withAddress") total
                    from beneficiarytransaction
                    where "withAddress" not in (select address from beneficiary) and date='${
                        reachedOutDate.toISOString().split('T')[0]
                    }'`;
            queryResults = (
                await queryInterface.sequelize.query(query, { raw: true })
            )[0];
            // update table
            await queryInterface.sequelize.query(
                `update globaldailystate set "reachOut" = ${
                    queryResults[0].total
                } where date = '${reachedOutDate.toISOString().split('T')[0]}'`
            );
            //
            reachedOutDate.setDate(reachedOutDate.getDate() + 1);
        }

        console.log('total reach by day');
        // query reached by day accumulated
        const reachedAccumulatedDate = new Date(firstDay.getTime());
        while (reachedAccumulatedDate.getTime() < limitDate) {
            query = `select count(distinct "withAddress") total from beneficiarytransaction where date <= '${
                reachedAccumulatedDate.toISOString().split('T')[0]
            }'`;
            queryResults = (
                await queryInterface.sequelize.query(query, { raw: true })
            )[0];
            // update table
            await queryInterface.sequelize.query(
                `update globaldailystate set "totalReach" = ${
                    queryResults[0].total
                } where date = '${
                    reachedAccumulatedDate.toISOString().split('T')[0]
                }'`
            );
            //
            reachedAccumulatedDate.setDate(
                reachedAccumulatedDate.getDate() + 1
            );
        }

        console.log('total reach out by day');
        // query reached out by day accumulated
        const reachedOutAccumulatedDate = new Date(firstDay.getTime());
        while (reachedOutAccumulatedDate.getTime() < limitDate) {
            query = `select count(distinct "withAddress") total from beneficiarytransaction where date <= '${
                reachedOutAccumulatedDate.toISOString().split('T')[0]
            }' and "withAddress" not in (select address from beneficiary)`;
            queryResults = (
                await queryInterface.sequelize.query(query, { raw: true })
            )[0];
            // update table
            await queryInterface.sequelize.query(
                `update globaldailystate set "totalReachOut" = ${
                    queryResults[0].total
                } where date = '${
                    reachedOutAccumulatedDate.toISOString().split('T')[0]
                }'`
            );
            //
            reachedOutAccumulatedDate.setDate(
                reachedOutAccumulatedDate.getDate() + 1
            );
        }
    },

    down(queryInterface, Sequelize) {},
};
