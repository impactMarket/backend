import { literal, Op } from 'sequelize';

import { models } from '../../database';
import { BaseError } from '../../utils/baseError';

export default class LearnAndEarnService {
    public async total(userId: number) {
        try {
            // get levels
            const levels = await models.learnAndEarnLevel.findAll({
                attributes: [
                    [
                        literal(
                            `count(*) FILTER (WHERE "userLevel".status = 'complete')`
                        ),
                        'complete',
                    ],
                    [literal(`count(*)`), 'total'],
                ],
                include: [
                    {
                        attributes: [],
                        model: models.learnAndEarnUserLevel,
                        as: 'userLevel',
                        where: {
                            userId,
                        },
                        required: false,
                    },
                ],
                where: {
                    active: true,
                },
                raw: true,
            });

            // get lessons
            const lessons = await models.learnAndEarnLesson.findAll({
                attributes: [
                    [
                        literal(
                            `count(*) FILTER (WHERE "userLesson".status = 'complete')`
                        ),
                        'complete',
                    ],
                    [literal(`count(*)`), 'total'],
                ],
                include: [
                    {
                        attributes: [],
                        model: models.learnAndEarnUserLesson,
                        as: 'userLesson',
                        where: {
                            userId,
                        },
                        required: false,
                    },
                ],
                where: {
                    active: true,
                },
                raw: true,
            });

            // get earned
            const payments = await models.learnAndEarnPayment.findOne({
                attributes: [[literal(`sum(amount)`), 'amount']],
                where: {
                    userId,
                },
                raw: true,
            });

            return {
                lessons: lessons[0],
                levels: levels[0],
                received: payments?.amount || 0,
            };
        } catch (error) {
            throw new BaseError('GET_TOTAL_FAILED', 'get total failed');
        }
    }

    public async answer(userId: number, answers: { quiz: string, answer: string }[]) {
        try {
            const quizzes = await models.learnAndEarnQuiz.findAll({
                where: {
                    prismicId: {
                        [Op.in]: answers.map(el => el.quiz)
                    }
                }
            });

            if (!quizzes || !quizzes.length) {
                throw new BaseError('QUIZ_NOT_FOUND', 'quiz not found');
            }

            const wrongAnswers = answers.reduce((acc, el) => {
                const quiz = quizzes.find(quiz => quiz.prismicId === el.quiz);
                if (quiz?.answerId !== el.answer) {
                    acc.push(el.quiz)
                }
                return acc
            }, [] as string[]);

            if (wrongAnswers && wrongAnswers.length > 0) {
                // marcar tentativas realizadas
                const tries = await models.learnAndEarnUserLesson.update({
                    attempts: literal('attempts + 1')
                }, {
                    where: {
                        userId,
                        lessonId: quizzes[0].lessonId,
                        status: 'pending',
                    },
                    returning: true,
                });

                // retornar respostas erradas
                return {
                    success: false,
                    wrongAnswers,
                    attempts: tries[1][0].attempts
                }
            } else {
                // completar lesson, calcular pontos
                const userLesson = await models.learnAndEarnUserLesson.findOne({
                    where: {
                        lessonId: quizzes[0].lessonId,
                        status: 'pending'
                    }
                });

                if (!userLesson) {
                    throw new BaseError('LESSON_ALREADY_COMPLETED', 'lesson already completed')
                }

                const attempts = userLesson?.attempts! + 1;
                let points = 0;
                switch (attempts) {
                    case 1:
                        points = 10;
                        break;
                    case 2:
                        points = 8;
                        break;
                    case 3:
                        points = 5;
                        break;
                    default:
                        points = 0;
                        break;
                }

                await models.learnAndEarnUserLesson.update({
                    attempts,
                    points,
                    status: 'complete',
                    completionDate: new Date(),
                }, {
                    where: {
                        userId,
                        lessonId: quizzes[0].lessonId
                    },
                });

                // verificar se todas as lessons foram completadas para esse level
                const lesson = await models.learnAndEarnLesson.findOne({ where : { id: quizzes[0].lessonId }});
                const pendingLessons = (await models.learnAndEarnLesson.findAll({
                    attributes: [
                        [
                            literal(
                                `count(*) FILTER (WHERE "userLesson".status = 'pending' or "userLesson".status is null)`
                            ),
                            'pending',
                        ],
                    ],
                    include: [
                        {
                            attributes: [],
                            model: models.learnAndEarnUserLesson,
                            as: 'userLesson',
                            where: {
                                userId,
                            },
                            required: false,
                        },
                    ],
                    where: {
                        levelId: lesson!.levelId,
                        active: true,
                    },
                    raw: true,
                })) as any;

                if (pendingLessons[0] && pendingLessons[0].pending === '0') {
                    // se sim, completar o level e fazer o pagamento
                    await models.learnAndEarnUserLevel.update({
                        status: 'complete',
                        completionDate: new Date(),
                    },{
                        where: {
                            userId,
                            levelId: lesson!.levelId,
                        },
                    });

                    // TODO: payment

                    // verificar se a categoria foi completa
                    const level = await models.learnAndEarnLevel.findOne({ where : { id: lesson!.levelId }});
                    const pendingLevels = (await models.learnAndEarnLevel.findAll({
                        attributes: [
                            [
                                literal(
                                    `count(*) FILTER (WHERE "userLevel".status = 'pending' or "userLevel".status is null)`
                                ),
                                'pending',
                            ],
                        ],
                        include: [
                            {
                                attributes: [],
                                model: models.learnAndEarnUserLevel,
                                as: 'userLevel',
                                where: {
                                    userId,
                                },
                                required: false,
                            },
                        ],
                        where: {
                            active: true,
                            categoryId: level!.categoryId,
                        },
                        raw: true,
                    })) as any;

                    if (pendingLevels[0] && pendingLevels[0].pending === '0') {
                        // se sim, completar a categoria
                        await models.learnAndEarnUserCategory.update({
                            status: 'complete',
                            completionDate: new Date(),
                        },{
                            where: {
                                userId,
                                categoryId: level!.categoryId,
                            },
                        });
                        const category = await models.learnAndEarnCategory.findOne({
                            attributes: ['prismicId'],
                            where: {
                                id: level!.categoryId,
                            }
                        });

                        return {
                            success: true,
                            attempts,
                            points,
                            levelCompleted: level!.prismicId,
                            categoryCompleted: category!.prismicId,
                        }
                    } else {
                        return {
                            success: true,
                            attempts,
                            points,
                            levelCompleted: level!.prismicId,
                        }
                    }
                } else {
                    return {
                        success: true,
                        attempts,
                        points,
                    }
                }
            }
        } catch (error) {
            throw new BaseError(error.name || 'VERIFY_ANSWER_FAILED', error.message || 'failed to verify answers');
        }
    }
}
