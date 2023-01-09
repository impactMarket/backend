import { defaultAbiCoder } from '@ethersproject/abi';
import { arrayify } from '@ethersproject/bytes';
import { keccak256 } from '@ethersproject/keccak256';
import { Wallet } from '@ethersproject/wallet';
import BigNumber from 'bignumber.js';
import { literal, Op } from 'sequelize';

import config from '../../config';
import { models, sequelize } from '../../database';
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
    const wallet = new Wallet(config.learnAndEarnPrivateKey);
    const encoded = defaultAbiCoder.encode(
        ['address', 'uint256', 'uint256'],
        [
            beneficiaryAddress,
            levelId,
            // for the contract, the value needs to be in wei
            new BigNumber(amountEarned)
                .multipliedBy(new BigNumber(10).pow(18))
                .toString(),
        ]
    );
    const hash = keccak256(encoded);

    return wallet.signMessage(arrayify(hash));
}

async function calculateReward(
    userId: number,
    levelId: number,
    points: number
): Promise<number> {
    const level = await models.learnAndEarnLevel.findOne({
        attributes: ['totalReward'],
        where: {
            id: levelId,
        },
    });
    const previousPoints = await getTotalPoints(userId, levelId);
    const totalLessons = await models.learnAndEarnLesson.count({
        where: {
            levelId,
            active: true,
        },
    });
    const totalPointsEarned = previousPoints + points;
    const totalPointsAvailable = totalLessons * 10;
    let percentage = 0;

    const tierLength = totalPointsAvailable / 5;

    if (totalPointsEarned >= totalPointsAvailable) {
        percentage = 100;
    } else if (totalPointsEarned >= totalPointsAvailable - tierLength) {
        percentage = 85;
    } else if (totalPointsEarned >= totalPointsAvailable - tierLength * 2) {
        percentage = 75;
    } else if (totalPointsEarned >= totalPointsAvailable - tierLength * 3) {
        percentage = 55;
    } else if (totalPointsEarned >= totalPointsAvailable - tierLength * 4) {
        percentage = 35;
    } else if (totalPointsEarned > 0) {
        percentage = 15;
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
        // check if already completed a lesson today
        const completedToday = await models.learnAndEarnUserLesson.count({
            where: {
                completionDate: {
                    [Op.gte]: new Date().setHours(0, 0, 0, 0),
                },
            },
        });

        if (completedToday > 0) {
            throw new BaseError(
                'LESSON_DAILY_LIMIT',
                'a lesson has already been completed today'
            );
        }

        const quizzes = await models.learnAndEarnQuiz.findAll({
            where: {
                lessonId,
                active: true,
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
            const userLesson = await models.learnAndEarnUserLesson.increment(
                'attempts',
                {
                    by: 1,
                    where: {
                        userId: user.userId,
                        lessonId,
                        status: 'started',
                    },
                }
            );

            // return wrong answers
            return {
                success: false,
                wrongAnswers,
                attempts: userLesson[0][0][0].attempts,
            };
        }

        // completed lesson, calculate points
        const userLesson = await models.learnAndEarnUserLesson.findOne({
            where: {
                lessonId,
                userId: user.userId,
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
            const amount = await calculateReward(
                user.userId,
                level!.id,
                points
            );
            const signature = await signParams(user.address, level!.id, amount);
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
                    totalPoints: points + totalPoints,
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
                    totalPoints: points + totalPoints,
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
                totalPoints: points + totalPoints,
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
