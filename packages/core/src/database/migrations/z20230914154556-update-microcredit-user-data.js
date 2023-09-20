'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        // update levels

        const resUsersLevels = await queryInterface.sequelize.query(`select distinct ul."userId", u.language from learn_and_earn_user_level ul, learn_and_earn_prismic_level pl, app_user u where ul.status = 'completed' and ul."userId" = u.id and pl.language = u.language`);
        const usersLevels = resUsersLevels[0];

        for (let i = 0; i < usersLevels.length; i++) {
            const { userId, language } = usersLevels[i];
            const res = await queryInterface.sequelize.query(`SELECT count(*) FILTER (WHERE "userLevel".status = 'completed') AS "completed"
                FROM "learn_and_earn_prismic_level" AS "learnAndEarnPrismicLevel"
                LEFT OUTER JOIN "learn_and_earn_user_level" AS "userLevel" ON "learnAndEarnPrismicLevel"."levelId" = "userLevel"."levelId" AND "userLevel"."userId" = ${userId}
                WHERE "learnAndEarnPrismicLevel"."language" = '${language}';`);

            const { completed } = res[0][0];
            if (completed === 0) {
                continue;
            }
            await queryInterface.sequelize.query(`insert into learn_and_earn_user_data ("userId", levels) values (${userId}, ${completed})`);
        }

        // update lessons

        const resUsersLessons = await queryInterface.sequelize.query(`select distinct ul."userId", u.language from learn_and_earn_user_lesson ul, learn_and_earn_prismic_lesson pl, app_user u where ul.status = 'completed' and ul."userId" = u.id and pl.language = u.language`);
        const usersLessons = resUsersLessons[0];

        for (let i = 0; i < usersLessons.length; i++) {
            const { userId, language } = usersLessons[i];
            const res = await queryInterface.sequelize.query(`SELECT count(*) FILTER (WHERE "userLesson".status = 'completed') AS "completed"
                FROM "learn_and_earn_prismic_lesson" AS "learnAndEarnPrismicLesson"
                LEFT OUTER JOIN "learn_and_earn_user_lesson" AS "userLesson" ON "learnAndEarnPrismicLesson"."levelId" = "userLesson"."levelId"
                AND ("userLesson"."userId" = ${userId} AND "learnAndEarnPrismicLesson"."lessonId" = "userLesson"."lessonId")
                WHERE "learnAndEarnPrismicLesson"."language" = '${language}';`);
            const { completed } = res[0][0];
            if (completed === 0) {
                continue;
            }
            try {
                await queryInterface.sequelize.query(`insert into learn_and_earn_user_data ("userId", lessons) values (${userId}, ${completed})`);
            } catch (e) {
                await queryInterface.sequelize.query(`update learn_and_earn_user_data set lessons = ${completed} where "userId" = ${userId}`);
            }
        }
    },
    down: queryInterface => {}
};
