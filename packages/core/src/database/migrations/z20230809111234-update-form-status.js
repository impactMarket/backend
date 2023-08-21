'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.sequelize.query(`update microcredit_applications set status = 6 where status = 5`);
        await queryInterface.sequelize.query(`update microcredit_applications set status = 5 where status = 4`);
    },
    down: queryInterface => {}
};
