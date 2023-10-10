'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.sequelize.query(`
            DELETE FROM microcredit_docs AS t1
                WHERE id NOT IN (
                SELECT id
                FROM microcredit_docs AS t2
                WHERE t1."applicationId" = t2."applicationId"
                    AND t1.category = t2.category
                    AND t1.id < t2.id
                );
        `);
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
