'use strict';


module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('delete * from reachedaddress');

        // query reached by day

        // select count(distinct "withAddress"), date
        // from beneficiarytransaction
        // group by date
        // order by date


        // query reached out by day

        // select count(distinct "withAddress"), date
        // from beneficiarytransaction
        // where "withAddress" not in (select address from beneficiary)
        // group by date
        // order by date



        // query reached by day accumulated

        // select count(distinct "withAddress") from beneficiarytransaction where date < '2021-01-22'



        // query reached out by day accumulated

        // select count(distinct "withAddress") from beneficiarytransaction where date < '2021-01-22' and "withAddress" not in (select address from beneficiary)

    },

    down(queryInterface, Sequelize) {
    },
};
