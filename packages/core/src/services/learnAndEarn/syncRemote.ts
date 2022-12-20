import axios from 'axios';
import { Op } from 'sequelize';

import config from '../../config';
import { models } from '../../database';
import { BaseError } from '../../utils/baseError';
import { client as prismic } from '../../utils/prismic';

async function triggerHook(hook: string) {
    const response = await axios.get(hook);
    return response.data;
}

async function getPrismicLearnAndEarn() {
    try {
        const categoryIds: number[] = [],
            levelIds: number[] = [],
            lessonIds: number[] = [],
            quizIds: number[] = [];
        const response = await prismic.getAllByType('pwa-lae-category', {
            lang: 'en-us',
            fetchLinks: [
                'pwa-lae-level.reward',
                'pwa-lae-level.lessons',
                'pwa-lae-lesson.questions',
            ],
        });
        for (
            let categoryIndex = 0;
            categoryIndex < response.length;
            categoryIndex++
        ) {
            const prismicCategory = response[categoryIndex];
            // INSERT CATEGORY
            const category = await models.learnAndEarnCategory.findOrCreate({
                where: {
                    prismicId: prismicCategory.id,
                    active: true,
                },
            });
            categoryIds.push(category[0].id);

            for (
                let levelIndex = 0;
                levelIndex < prismicCategory.data.levels.length;
                levelIndex++
            ) {
                const prismicLevel =
                    prismicCategory.data.levels[levelIndex].level;

                if (prismicLevel.id) {
                    // INSERT LEVEL
                    const level = await models.learnAndEarnLevel.findOrCreate({
                        where: {
                            prismicId: prismicLevel.id,
                            totalReward: prismicLevel.data.reward,
                            active: true,
                            categoryId: category[0].id,
                        },
                    });
                    levelIds.push(level[0].id);

                    for (
                        let lessonIndex = 0;
                        lessonIndex < prismicLevel.data.lessons.length;
                        lessonIndex++
                    ) {
                        const prismicLesson =
                            prismicLevel.data.lessons[lessonIndex].lesson;

                        if (prismicLesson.id) {
                            // INSERT LESSON
                            const lesson =
                                await models.learnAndEarnLesson.findOrCreate({
                                    where: {
                                        prismicId: prismicLesson.id,
                                        active: true,
                                        levelId: level[0].id,
                                    },
                                });
                            lessonIds.push(lesson[0].id);

                            for (
                                let quizIndex = 0;
                                quizIndex < prismicLesson.data.questions.length;
                                quizIndex++
                            ) {
                                const prismicQuiz =
                                    prismicLesson.data.questions[quizIndex];

                                // INSERT QUIZ
                                const answer: number =
                                    prismicQuiz.items.findIndex(
                                        (item) => !!item['is-correct']
                                    );
                                const quiz =
                                    await models.learnAndEarnQuiz.findOrCreate({
                                        where: {
                                            order: quizIndex,
                                            active: true,
                                            lessonId: lesson[0].id,
                                            answer,
                                        },
                                    });
                                quizIds.push(quiz[0].id);
                            }
                        }
                    }
                }
            }
        }

        // INACTIVATE REGISTRIES
        await Promise.all([
            models.learnAndEarnCategory.update(
                {
                    active: false,
                },
                {
                    where: {
                        id: {
                            [Op.notIn]: categoryIds,
                        },
                    },
                }
            ),
            models.learnAndEarnLevel.update(
                {
                    active: false,
                },
                {
                    where: {
                        id: {
                            [Op.notIn]: levelIds,
                        },
                    },
                }
            ),
            models.learnAndEarnLesson.update(
                {
                    active: false,
                },
                {
                    where: {
                        id: {
                            [Op.notIn]: lessonIds,
                        },
                    },
                }
            ),
            models.learnAndEarnQuiz.update(
                {
                    active: false,
                },
                {
                    where: {
                        id: {
                            [Op.notIn]: quizIds,
                        },
                    },
                }
            ),
        ]);
    } catch (error) {
        console.log(error);
    }
}

export async function webhook(documents: string[]) {
    try {
        const document = documents[0];
        const prismicDocument = await prismic.getByID(document, {
            lang: '*',
        });

        const { type } = prismicDocument;

        if (!type) {
            throw new BaseError('DOCUMENT_NOT_FOUND', 'document not found');
        }

        if (type.startsWith('pwa')) {
            await getPrismicLearnAndEarn();

            return triggerHook(config.vercelWebhooks.pwa);
        }

        if (
            type.startsWith('website') ||
            type === 'translations' ||
            type === 'translations-site-temp'
        ) {
            return triggerHook(config.vercelWebhooks.website);
        }

        if (type.startsWith('wallet_')) {
            // execute wallet deploy
            return;
        }
    } catch (error) {
        throw new BaseError(
            error.name ? error.name : 'GET_DOCUMENT_FAILED',
            error.message
        );
    }
}
