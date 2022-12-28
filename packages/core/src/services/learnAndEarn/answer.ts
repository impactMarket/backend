import { arrayify } from '@ethersproject/bytes';
import { keccak256 } from '@ethersproject/solidity';
import { Wallet } from '@ethersproject/wallet';
import BigNumber from 'bignumber.js';
import { literal } from 'sequelize';

import config from '../../config';
import { models, sequelize } from '../../database';
import { LearnAndEarnUserLesson } from '../../interfaces/learnAndEarn/learnAndEarnUserLesson';
import { BaseError } from '../../utils/baseError';

async function countAvailableLessons(
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

    return parseInt(availableLessons[0].available, 10);
}

async function countAvailableLevels(
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

    return parseInt(availableLevels[0].available, 10);
}

async function getTotalPoints(
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

    return parseInt(totalPoints[0].total, 10);
}

async function signParams(
    beneficiaryAddress: string,
    levelId: number,
    amountEarned: number
): Promise<string> {
    const signer = new Wallet(config.learnAndEarnPrivateKey);

    const message = keccak256(
        ['address', 'uint256', 'uint256'],
        [
            beneficiaryAddress,
            levelId,
            // for the contract, the value needs to be in wei
            new BigNumber(amountEarned)
                .times(new BigNumber(10).pow(18))
                .toString(),
        ]
    );
    const arrayifyMessage = arrayify(message);
    return await signer.signMessage(arrayifyMessage);
}

async function calculateReward(
    userId: number,
    levelId: number
): Promise<number> {
    const level = await models.learnAndEarnLevel.findOne({
        attributes: ['totalReward'],
        where: {
            id: levelId,
        },
    });
    const points = await getTotalPoints(userId, levelId);
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

    return (percentage / 100) * level!.totalReward;
}

export async function answer(
    user: { userId: number; address: string },
    answers: number[],
    lessonId: number
) {
    const t = await sequelize.transaction();
    try {
        const quizzes = await models.learnAndEarnQuiz.findAll({
            where: {
                lessonId,
            },
            order: ['order'],
        });

        if (!quizzes || !quizzes.length) {
            throw new BaseError('QUIZ_NOT_FOUND', 'quiz not found');
        }

        const wrongAnswers = answers.reduce<number[]>((acc, el, index) => {
            const quiz = quizzes.find((quiz) => quiz.order === index);
            if (quiz?.answer !== el) {
                acc.push(index);
            }
            return acc;
        }, []);

        if (wrongAnswers && wrongAnswers.length > 0) {
            // set attempts
            let userLesson: LearnAndEarnUserLesson;
            const t = await sequelize.transaction();

            const [createdUserLesson, created] =
                await models.learnAndEarnUserLesson.findOrCreate({
                    where: {
                        attempts: 1,
                        userId: user.userId,
                        lessonId,
                        status: 'started',
                    },
                    transaction: t,
                });

            if (created) {
                userLesson = createdUserLesson;
            } else {
                userLesson = await models.learnAndEarnUserLesson.increment(
                    'attempts',
                    {
                        by: 1,
                        where: {
                            userId: user.userId,
                            lessonId,
                            status: 'started',
                        },
                        transaction: t,
                    }
                );
            }

            await t.commit();

            // return wrong answers
            return {
                success: false,
                wrongAnswers,
                attempts: userLesson.attempts,
            };
        }

        // completed lesson, calculate points
        const userLesson = await models.learnAndEarnUserLesson.findOne({
            where: {
                lessonId,
            },
        });

        if (userLesson && userLesson.status === 'completed') {
            throw new BaseError(
                'LESSON_ALREADY_COMPLETED',
                'lesson already completed'
            );
        }

        const attempts = (userLesson?.attempts || 0) + 1;
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
                    lessonId,
                },
                transaction: t,
            }
        );

        const lesson = await models.learnAndEarnLesson.findOne({
            where: { id: quizzes[0].lessonId },
        });
        const totalPoints = await getTotalPoints(user.userId, lesson!.levelId);
        // verify if all the lessons was completed
        const availableLessons = await countAvailableLessons(
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
                    transaction: t,
                }
            );

            // create signature
            const level = await models.learnAndEarnLevel.findOne({
                where: { id: lesson!.levelId },
            });
            const signature = await signParams(
                user.address,
                level!.id,
                level!.totalReward
            );
            const amount = await calculateReward(user.userId, level!.id);
            await models.learnAndEarnPayment.create(
                {
                    userId: user.userId,
                    levelId: level!.id,
                    amount,
                    status: 'pending',
                    signature,
                },
                { transaction: t }
            );

            // verify if the category was completed
            const availableLevels = await countAvailableLevels(
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
                        transaction: t,
                    }
                );
                const category = await models.learnAndEarnCategory.findOne({
                    attributes: ['prismicId'],
                    where: {
                        id: level!.categoryId,
                    },
                });
                await t.commit();

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
                await t.commit();
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
            await t.commit();
            return {
                success: true,
                attempts,
                points,
                totalPoints,
                availableLessons,
            };
        }
    } catch (error) {
        await t.rollback();
        throw new BaseError(
            error.name || 'VERIFY_ANSWER_FAILED',
            error.message || 'failed to verify answers'
        );
    }
}
