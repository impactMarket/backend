import { literal, Op } from 'sequelize';

import { models } from '../../database';
import { BaseError } from '../../utils/baseError';
import { ethers } from 'ethers';

export default class LearnAndEarnService {
    public async total(userId: number): Promise<{
        lesson: {
            completed: number;
            total: number;
        };
        level: {
            completed: number;
            total: number;
        };
        reward: {
            received: number;
            total: number;
        };
    }> {
        try {
            // get levels
            const levels = (await models.learnAndEarnLevel.findAll({
                attributes: [
                    [
                        literal(
                            `count(*) FILTER (WHERE "userLevel".status = 'completed')`
                        ),
                        'completed',
                    ],
                    [literal(`sum("totalReward")`), 'totalReward'],
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
            })) as any;

            // get lessons
            const lessons = (await models.learnAndEarnLesson.findAll({
                attributes: [
                    [
                        literal(
                            `count(*) FILTER (WHERE "userLesson".status = 'completed')`
                        ),
                        'completed',
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
            })) as any;

            // get earned
            const payments = await models.learnAndEarnPayment.findOne({
                attributes: [[literal(`sum(amount)`), 'amount']],
                where: {
                    userId,
                },
                raw: true,
            });

            return {
                lesson: {
                    completed: parseInt(lessons[0].completed),
                    total: parseInt(lessons[0].total),
                },
                level: {
                    completed: parseInt(levels[0].completed),
                    total: parseInt(levels[0].total),
                },
                reward: {
                    received: payments?.amount || 0,
                    total: parseInt(levels[0].totalReward),
                },
            };
        } catch (error) {
            throw new BaseError('GET_TOTAL_FAILED', 'get total failed');
        }
    }

    public async answer(user: { userId: number, address: string }, answers: string[], lesson: number) {
        try {
            const quizzes = await models.learnAndEarnQuiz.findAll({
                where: {
                    lessonId: lesson,
                },
                order: ['order']
            });

            if (!quizzes || !quizzes.length) {
                throw new BaseError('QUIZ_NOT_FOUND', 'quiz not found');
            }

            const wrongAnswers = answers.reduce((acc, el, index) => {
                const quiz = quizzes.find(quiz => quiz.order === index);
                if (quiz?.answerId !== el) {
                    acc.push(index);
                }
                return acc;
            }, [] as number[]);

            if (wrongAnswers && wrongAnswers.length > 0) {
                // set attempts
                const userLesson = await models.learnAndEarnUserLesson.update(
                    {
                        attempts: literal('attempts + 1'),
                    },
                    {
                        where: {
                            userId: user.userId,
                            lessonId: quizzes[0].lessonId,
                            status: 'started',
                        },
                        returning: true,
                    }
                );

                // return wrong answers
                return {
                    success: false,
                    wrongAnswers,
                    attempts: userLesson[1][0].attempts,
                };
            } else {
                // completed lesson, calculate points
                const userLesson = await models.learnAndEarnUserLesson.findOne({
                    where: {
                        lessonId: quizzes[0].lessonId,
                        status: 'started',
                    },
                });

                if (!userLesson) {
                    throw new BaseError(
                        'LESSON_ALREADY_COMPLETED',
                        'lesson already completed'
                    );
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

                await models.learnAndEarnUserLesson.update(
                    {
                        attempts,
                        points,
                        status: 'completed',
                        completionDate: new Date(),
                    },
                    {
                        where: {
                            userId: user.userId,
                            lessonId: quizzes[0].lessonId,
                        },
                    }
                );

                const lesson = await models.learnAndEarnLesson.findOne({
                    where: { id: quizzes[0].lessonId },
                });
                const totalPoints = await this.getTotalPoints(
                    user.userId,
                    lesson!.levelId
                );
                // verify if all the lessons was completed
                const availableLessons = await this.countAvailableLessons(
                    lesson!.levelId,
                    user.userId
                );

                if (availableLessons === 0) {
                    // if so, complete the level and make the payment
                    await models.learnAndEarnUserLevel.update(
                        {
                            status: 'completed',
                            completionDate: new Date(),
                        },
                        {
                            where: {
                                userId: user.userId,
                                levelId: lesson!.levelId,
                            },
                        }
                    );

                    // create signature
                    const level = await models.learnAndEarnLevel.findOne({
                        where: { id: lesson!.levelId },
                    });
                    const signature = await this.signParams(user.address, level!.id, level!.totalReward);
                    const amount = await this.calculateReward(user.userId, level!.id);
                    await models.learnAndEarnPayment.create({
                        userId: user.userId,
                        levelId: level!.id,
                        amount,
                        status: 'pending',
                        signature,
                    });


                    // verify if the category was completed
                    const availableLevels = await this.countAvailableLevels(
                        level!.categoryId,
                        user.userId
                    );

                    if (availableLevels === 0) {
                        // if so, complete category
                        await models.learnAndEarnUserCategory.update(
                            {
                                status: 'completed',
                                completionDate: new Date(),
                            },
                            {
                                where: {
                                    userId: user.userId,
                                    categoryId: level!.categoryId,
                                },
                            }
                        );
                        const category =
                            await models.learnAndEarnCategory.findOne({
                                attributes: ['prismicId'],
                                where: {
                                    id: level!.categoryId,
                                },
                            });

                        return {
                            success: true,
                            attempts,
                            points,
                            totalPoints,
                            availableLessons,
                            levelCompleted: level!.prismicId,
                            categoryCompleted: category!.prismicId,
                        };
                    } else {
                        return {
                            success: true,
                            attempts,
                            points,
                            totalPoints,
                            availableLessons,
                            levelCompleted: level!.prismicId,
                        };
                    }
                } else {
                    return {
                        success: true,
                        attempts,
                        points,
                        totalPoints,
                        availableLessons,
                    };
                }
            }
        } catch (error) {
            throw new BaseError(
                error.name || 'VERIFY_ANSWER_FAILED',
                error.message || 'failed to verify answers'
            );
        }
    }

    public async startLesson(userId: number, lessonId: number) {
        try {
            const status = 'started';
            const lesson = await models.learnAndEarnLesson.findOne({
                attributes: ['levelId'],
                where: {
                    id: lessonId,
                },
            });
            const level = await models.learnAndEarnLevel.findOne({
                attributes: ['id', 'categoryId'],
                where: {
                    id: lesson!.levelId,
                },
            });

            // create userLesson
            const userLesson = await models.learnAndEarnUserLesson.findOrCreate(
                {
                    where: {
                        lessonId,
                        userId,
                    },
                    defaults: {
                        lessonId,
                        userId,
                        points: 0,
                        attempts: 0,
                        status,
                    },
                }
            );

            const userLevel = await models.learnAndEarnUserLevel.findOrCreate({
                where: {
                    levelId: lesson!.levelId,
                    userId,
                },
                defaults: {
                    levelId: lesson!.levelId,
                    userId,
                    status,
                },
            });

            const userCategory =
                await models.learnAndEarnUserCategory.findOrCreate({
                    where: {
                        categoryId: level!.categoryId,
                        userId,
                    },
                    defaults: {
                        categoryId: level!.categoryId,
                        userId,
                        status,
                    },
                });

            return {
                lesson: userLesson[0].toJSON(),
                level: userLevel[0].toJSON(),
                category: userCategory[0].toJSON(),
            };
        } catch (error) {
            throw new BaseError(
                error.name || 'START_LESSON_FAILED',
                error.message || 'failed to start a lesson'
            );
        }
    }

    public async listLevels(
        userId: number,
        status: string,
        offset: number,
        limit: number,
        category?: string,
        level?: string
    ): Promise<{
        count: number;
        rows: {
            id: number;
            prismicId: string;
            totalReward: number;
            status: string;
            totalLessons: number;
        }[];
    }> {
        try {
            const where: any = {
                [Op.and]: [
                    literal(
                        status === 'completed'
                            ? `"userLevel".status = '${status}'`
                            : `"userLevel".status = 'started' or "userLevel".status is null`
                    ),
                    level ? { prismicId: level } : {},
                    { active: true },
                ],
            };
            const userLevels = await models.learnAndEarnLevel.findAll({
                attributes: [
                    'id',
                    'prismicId',
                    'totalReward',
                    [literal('"userLevel".status'), 'status'],
                    [literal(`count(lesson.id)`), 'totalLessons'],
                ],
                include: [
                    {
                        attributes: [],
                        model: models.learnAndEarnUserLevel,
                        as: 'userLevel',
                        required: false,
                        where: {
                            userId,
                        },
                        duplicating: false,
                    },
                    {
                        attributes: [],
                        model: models.learnAndEarnLesson,
                        as: 'lesson',
                        duplicating: false,
                    },
                    {
                        attributes: ['prismicId'],
                        model: models.learnAndEarnCategory,
                        as: 'category',
                        duplicating: false,
                        ...(category
                            ? {
                                  where: {
                                      prismicId: category,
                                  },
                              }
                            : {}),
                    },
                ],
                where,
                group: [
                    '"LearnAndEarnLevelModel".id',
                    '"LearnAndEarnLevelModel".prismicId',
                    '"LearnAndEarnLevelModel"."totalReward"',
                    'category."prismicId',
                    '"userLevel".status',
                ],
                limit,
                offset,
                raw: true,
            });

            const count = await models.learnAndEarnLevel.count({
                attributes: [],
                include: [
                    {
                        attributes: [],
                        model: models.learnAndEarnUserLevel,
                        as: 'userLevel',
                        required: false,
                        where: {
                            userId,
                        },
                    },
                    {
                        attributes: [],
                        model: models.learnAndEarnCategory,
                        as: 'category',
                        ...(category
                            ? {
                                  where: {
                                      prismicId: category,
                                  },
                              }
                            : {}),
                    },
                ],
                where,
            });

            return {
                count,
                rows: userLevels.map((el: any) => ({
                    id: el.id,
                    prismicId: el.prismicId,
                    totalReward: parseInt(el.totalReward),
                    totalLessons: parseInt(el.totalLessons),
                    status: (el.status = el.status || 'available'),
                    category: el['category.prismicId'],
                })),
            };
        } catch (error) {
            throw new BaseError('LIST_LEVELS_FAILED', 'list levels failed');
        }
    }

    public async listLessons(userId: number, levelId: number) {
        try {
            const lessons = await models.learnAndEarnLesson.findAll({
                include: [
                    {
                        attributes: ['status'],
                        model: models.learnAndEarnUserLesson,
                        as: 'userLesson',
                        required: false,
                        where: {
                            userId,
                        },
                    },
                ],
                where: {
                    levelId,
                    active: true,
                },
            });

            return lessons.map((lesson: any) => ({
                id: lesson.id,
                prismicId: lesson.prismicId,
                levelId: lesson.levelId,
                status: lesson.userLesson[0]?.status || 'available',
            }));
        } catch (error) {
            throw new BaseError('LIST_LESSONS_FAILED', 'list lessons failed');
        }
    }

    private async countAvailableLessons(
        levelId: number,
        userId: number
    ): Promise<number> {
        const availableLessons = (await models.learnAndEarnLesson.findAll({
            attributes: [
                [
                    literal(
                        `count(*) FILTER (WHERE "userLesson".status = 'available' or "userLesson".status is null)`
                    ),
                    'available',
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
                levelId,
                active: true,
            },
            raw: true,
        })) as any;

        return parseInt(availableLessons[0].available);
    }

    private async countAvailableLevels(
        categoryId: number,
        userId: number
    ): Promise<number> {
        const availableLevels = (await models.learnAndEarnLevel.findAll({
            attributes: [
                [
                    literal(
                        `count(*) FILTER (WHERE "userLevel".status = 'available' or "userLevel".status is null)`
                    ),
                    'available',
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
                categoryId,
            },
            raw: true,
        })) as any;

        return parseInt(availableLevels[0].available);
    }

    private async getTotalPoints(
        userId: number,
        levelId: number
    ): Promise<number> {
        const totalPoints = (await models.learnAndEarnUserLesson.findAll({
            attributes: [[literal(`sum(points)`), 'total']],
            include: [
                {
                    attributes: [],
                    model: models.learnAndEarnLesson,
                    as: 'lesson',
                    where: {
                        levelId,
                    },
                },
            ],
            where: {
                userId,
            },
            raw: true,
        })) as any;

        return parseInt(totalPoints[0].total);
    }

    private async signParams(
        beneficiaryAddress: string,
        programId: number,
        amountEarned: number
     ): Promise<string> {
        const signer = new ethers.Wallet('0x0123456789012345678901234567890123456789012345678901234567890123');

        const message = ethers.utils.solidityKeccak256(
           ["address", "uint256", "uint256"],
           [beneficiaryAddress, programId, amountEarned]
        );
        const arrayifyMessage = ethers.utils.arrayify(message);
        return signer.signMessage(arrayifyMessage);
     }

     private async calculateReward(userId: number, levelId: number): Promise<number> {
        const level = await models.learnAndEarnLevel.findOne({
            attributes: ['totalReward'],
            where: {
                id: levelId,
            }
        });
        const points = await this.getTotalPoints(userId, levelId);
        let percentage = 0;


        if (points < 10) {
            percentage = 15;
        } else if (points >= 10 && points < 20) {
            percentage = 35;
        } else if (points >= 20 && points < 30) {
            percentage = 55;
        } else if (points >= 30 && points < 40) {
            percentage = 75;            
        } else if (points >= 40 && points < 50) {
            percentage = 85;            
        } else if (points >= 50) {
            percentage = 100;            
        }

        return ((percentage/ 100) * level!.totalReward);
     }
}
