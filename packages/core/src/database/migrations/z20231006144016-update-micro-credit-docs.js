'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('microcredit_docs', 'applicationId', {
            type: Sequelize.INTEGER,
            allowNull: true
        });

        await queryInterface.sequelize.query(`
            UPDATE microcredit_docs
            SET "applicationId" = (
                SELECT id
                FROM microcredit_applications
                WHERE microcredit_applications."userId" = microcredit_docs."userId"
                ORDER BY "createdAt" DESC
                LIMIT 1
            )
            WHERE "applicationId" IS NULL
        `);

        await queryInterface.sequelize.query(`
            DELETE from microcredit_docs
            WHERE "applicationId" IS NULL
        `);

        await queryInterface.changeColumn('microcredit_docs', 'applicationId', {
            type: Sequelize.INTEGER,
            allowNull: false
        });
    },
    async down(queryInterface, Sequelize) {
        //
    }
};
