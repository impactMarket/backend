import { BaseError } from '../../utils/baseError';
import { models, sequelize } from '../../database';
import { client as prismic } from '../../utils/prismic';

async function getPrismicLearnAndEarn() {
    const t = await sequelize.transaction();

    try {
        // get prismic data
        const response = await prismic.getAllByType('pwa-lae-level', {
            lang: '*',
            fetchLinks: [
                'pwa-lae-level.reward',
                'pwa-lae-level.id',
                'pwa-lae-level.is_live',
                'pwa-lae-level.lessons',
                'pwa-lae-lesson.id',
                'pwa-lae-lesson.is_live'
            ]
        });

        const previousLevels = await models.learnAndEarnPrismicLevel.findAll();

        // clean levels
        await models.learnAndEarnPrismicLevel.destroy({
            truncate: true,
            transaction: t
        });
        // clean lessons
        await models.learnAndEarnPrismicLesson.destroy({
            truncate: true,
            transaction: t
        });

        // insert new levels
        for (let levelIndex = 0; levelIndex < response.length; levelIndex++) {
            const prismicLevel = response[levelIndex];

            if (prismicLevel.data.id) {
                // check if level exists locally
                const level = await models.learnAndEarnLevel.findOne({
                    attributes: ['id'],
                    where: {
                        id: prismicLevel.data.id
                    }
                });

                if (!level?.id) {
                    continue;
                }

                // update reward
                await models.learnAndEarnLevel.update(
                    {
                        totalReward: prismicLevel.data.reward || 0
                    },
                    {
                        where: {
                            id: prismicLevel.data.id
                        },
                        transaction: t
                    }
                );

                const lang = prismicLevel.lang ? prismicLevel.lang.split('-')[0] : 'en';

                // set the availableAt
                const previous = previousLevels.find(level => level.prismicId === prismicLevel.id);
                let availableAt: Date | undefined;

                if (previous) {
                    availableAt = !previous.isLive && prismicLevel.data.is_live ? new Date() : previous.availableAt;
                } else {
                    // first creation
                    availableAt = prismicLevel.data.is_live ? new Date() : undefined;
                }

                await models.learnAndEarnPrismicLevel.create(
                    {
                        prismicId: prismicLevel.id,
                        levelId: prismicLevel.data.id,
                        language: lang,
                        isLive: prismicLevel.data.is_live,
                        availableAt,
                    },
                    {
                        transaction: t
                    }
                );

                const { lessons } = prismicLevel.data;

                for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
                    const prismicLesson = lessons[lessonIndex].lesson;
                    if (prismicLesson.data?.id) {
                        await models.learnAndEarnPrismicLesson.create(
                            {
                                prismicId: prismicLesson.id,
                                levelId: prismicLevel.data.id,
                                lessonId: prismicLesson.data.id,
                                language: lang,
                                isLive: prismicLesson.data.is_live
                            },
                            {
                                transaction: t
                            }
                        );
                    }
                }
            }
        }

        await t.commit();
    } catch (error) {
        await t.rollback();
        console.log('e', error);
    }
}

export async function webhook() {
    try {
        await getPrismicLearnAndEarn();
    } catch (error) {
        throw new BaseError(error.name ? error.name : 'GET_DOCUMENT_FAILED', error.message);
    }
}
