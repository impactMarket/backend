'use strict';

const prismic = require('@prismicio/client');

const endpoint = prismic.getEndpoint(process.env.PRISMIC_REPO);
const accessToken = process.env.PRISMIC_ACCESS_TOKEN;

const client = prismic.createClient(endpoint, { accessToken });

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        // get all user lesson
        const userLessons = await queryInterface.sequelize.query(
            `select learn_and_earn_user_lesson.id as id, learn_and_earn_lesson."prismicId" as "prismicId", learn_and_earn_lesson."levelId" as "levelId"
                from learn_and_earn_user_lesson inner join learn_and_earn_lesson on learn_and_earn_user_lesson."lessonId" = learn_and_earn_lesson.id
                where learn_and_earn_user_lesson."levelId" is null`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // get prismic id
        const prismicIds = userLessons.map((userLesson) => userLesson.prismicId);

        // get prismic document
        try {
            const prismicData = await client.getAllByIDs(prismicIds);

            userLessons.forEach(async (userLesson) => {
                const prismic = prismicData.find(
                    (el) => el.id === userLesson.prismicId
                );
                const levelId = userLesson.levelId;
                const lessonId = prismic.data.id;

                if (!!levelId && !!lessonId) {
                    await queryInterface.sequelize.query(
                        `update learn_and_earn_user_lesson set "levelId" = ${levelId}, "lessonId" = ${lessonId} where id = ${userLesson.id}`
                    );
                }
            });

            // throw new Error();

        } catch (error) {
            console.log(error);
            throw new Error();

        }
    },
    down: (queryInterface) => {},
};
