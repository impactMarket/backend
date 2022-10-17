'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        // update coverMediaPath
        const queryCommunity = `
        update community
        set "coverMediaPath" = media.path
        from (select community.id, split_part(url, '${process.env.CLOUDFRONT_URL}/', 2) as path
                from community inner join app_media_content amc on community."coverMediaId" = amc.id
                where "coverMediaPath" is null and url like '${process.env.CLOUDFRONT_URL}/%') as media
        where media.id = community.id`;
        console.log(queryCommunity)
        await queryInterface.sequelize.query(queryCommunity, {
            raw: true,
            type: Sequelize.QueryTypes.UPDATE,
        });

        // update avatarMediaPath
        const queryAvatar = `
        update app_user
        set "avatarMediaPath" = media.path
        from (select app_user.id, split_part(url, '${process.env.CLOUDFRONT_URL}/', 2) as path
                from app_user inner join app_media_content amc on app_user."avatarMediaId" = amc.id
                where "avatarMediaPath" is null and url like '${process.env.CLOUDFRONT_URL}/%') as media
        where media.id = app_user.id`;
        console.log(queryAvatar)
        await queryInterface.sequelize.query(queryAvatar, {
            raw: true,
            type: Sequelize.QueryTypes.UPDATE,
        });

        // update storyMediaPath
        const queryStory = `
        update story_content
        set "storyMediaPath" = media.path
        from (select story_content.id, split_part(url, '${process.env.CLOUDFRONT_URL}/', 2) as path
                from story_content inner join app_media_content amc on story_content."mediaMediaId" = amc.id
                where "storyMediaPath" is null and url like '${process.env.CLOUDFRONT_URL}/%') as media
        where media.id = story_content.id`;
        console.log(queryStory)
        await queryInterface.sequelize.query(queryStory, {
            raw: true,
            type: Sequelize.QueryTypes.UPDATE,
        });
    },

    down(queryInterface, Sequelize) {},
};
