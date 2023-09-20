'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        // some of this are very old tables without any usage
        // some might not exist anymore in some environments

        try {
            await queryInterface.removeConstraint('story_content', 'story_content_mediaMediaId_fkey');
        } catch (e) { console.error(e); }
        try {
            await queryInterface.removeConstraint('user', 'user_avatarMediaId_fkey');
        } catch (e) { console.error(e); }
        try {
            await queryInterface.removeConstraint('community', 'community_coverMediaId_fkey');
        } catch (e) { console.error(e); }
        try {
            await queryInterface.removeColumn('story_content', 'mediaMediaId');
        } catch (e) { console.error(e); }
        try {
            await queryInterface.sequelize.query(`drop table ubi_claim`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table beneficiarytransaction`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table ubi_beneficiary_transaction`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table ubi_organization_social_media`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table ubi_community_organization`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table ubi_organization`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table app_media_thumbnail`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table app_media_content`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table beneficiary`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table manager`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
        try {
            await queryInterface.sequelize.query(`drop table ubi_beneficiary_registry`, { type: Sequelize.QueryTypes.DELETE });
        } catch (_) { }
    },
    async down(queryInterface, Sequelize) {}
};
