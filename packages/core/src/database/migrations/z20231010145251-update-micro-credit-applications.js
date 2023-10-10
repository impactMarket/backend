'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        
        // update microcredit_applications setting signedOn to each user, based on when the user uploaded a doc to microcredit_docs with category 1
        await queryInterface.sequelize.query(`
            UPDATE microcredit_applications
            SET "signedOn" = (
                SELECT "createdAt"
                FROM microcredit_docs
                WHERE microcredit_docs."userId" = microcredit_applications."userId"
                AND microcredit_docs."category" = 1
                ORDER BY "createdAt" DESC
                LIMIT 1
            )
        `);

        // update microcredit_applications setting claimedOn to each user, based on when the user claimed the loan, getting that info from "claimed" on subgraph_microcredit_borrowers
        await queryInterface.sequelize.query(`
            UPDATE microcredit_applications
            SET "claimedOn" = (
                SELECT to_timestamp("claimed")::timestamptz
                FROM subgraph_microcredit_borrowers
                WHERE subgraph_microcredit_borrowers."userId" = microcredit_applications."userId"
                ORDER BY "createdAt" DESC
                LIMIT 1
            )
        `);
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
