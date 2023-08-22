'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.removeConstraint('story_content', 'story_content_mediaMediaId_fkey');
        await queryInterface.removeColumn('story_content', 'mediaMediaId');

        await queryInterface.sequelize.query(`drop table ubi_claim`, { type: Sequelize.QueryTypes.DELETE });
        await queryInterface.sequelize.query(`drop table beneficiarytransaction`, { type: Sequelize.QueryTypes.DELETE });
        await queryInterface.sequelize.query(`drop table ubi_beneficiary_transaction`, { type: Sequelize.QueryTypes.DELETE });
        await queryInterface.sequelize.query(`drop table app_media_content`, { type: Sequelize.QueryTypes.DELETE });
        await queryInterface.sequelize.query(`drop table app_media_thumbnail`, { type: Sequelize.QueryTypes.DELETE });
        await queryInterface.sequelize.query(`drop table beneficiary`, { type: Sequelize.QueryTypes.DELETE });
        await queryInterface.sequelize.query(`drop table manager`, { type: Sequelize.QueryTypes.DELETE });
        await queryInterface.sequelize.query(`drop table ubi_beneficiary_registry`, { type: Sequelize.QueryTypes.DELETE });
    },
    async down(queryInterface, Sequelize) {}
};
