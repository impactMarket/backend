import { Op, Transaction, literal } from 'sequelize';
import { Wallet } from '@ethersproject/wallet';
import { arrayify } from '@ethersproject/bytes';
import { defaultAbiCoder } from '@ethersproject/abi';
import { keccak256 } from '@ethersproject/keccak256';
import { client as prismic } from '../../utils/prismic';
import BigNumber from 'bignumber.js';

import { BaseError } from '../../utils/baseError';
import { cleanLearnAndEarnCache } from '../../utils/cache';
import { contracts } from '../../../index';
import { ethers } from 'ethers';
// import { getUserRoles } from '../../subgraph/queries/user';
import { models, sequelize } from '../../database';
import config from '../../config';

async function countAvailableLessons(levelId: number, userId: number): Promise<number> {
    const availableLessons = (await models.learnAndEarnPrismicLesson.findAll({
        attributes: [
            [
                literal(
                    `count(distinct "learnAndEarnPrismicLesson"."lessonId") FILTER (WHERE "userLesson".status = 'available' or "userLesson".status is null)`
                ),
                'available'
            ]
        ],
        include: [
            {
                attributes: [],
                model: models.learnAndEarnUserLesson,
                as: 'userLesson',
                where: {
                    userId
                },
                required: false
            }
        ],
        where: {
            levelId
        },
        raw: true
    })) as any;

    return parseInt(availableLessons[0].available, 10);
}

async function getTotalPoints(userId: number, levelId: number): Promise<number> {
    const totalPoints = (await models.learnAndEarnUserLesson.findAll({
        attributes: [[literal(`sum(points)`), 'total']],
        where: {
            userId,
            levelId
        },
        raw: true
    })) as any;

    return parseInt(totalPoints[0].total, 10);
}

async function signParams(beneficiaryAddress: string, levelId: number, amountEarned: number): Promise<string> {
    const wallet = new Wallet(config.learnAndEarnPrivateKey);
    const encoded = defaultAbiCoder.encode(
        ['address', 'uint256', 'uint256'],
        [
            beneficiaryAddress,
            levelId,
            // for the contract, the value needs to be in wei
            new BigNumber(amountEarned).multipliedBy(new BigNumber(10).pow(18)).toString()
        ]
    );
    const hash = keccak256(encoded);

    return wallet.signMessage(arrayify(hash));
}

async function calculateReward(userId: number, levelId: number, points: number): Promise<number> {
    const level = await models.learnAndEarnLevel.findOne({
        attributes: ['totalReward'],
        where: {
            id: levelId
        }
    });
    const previousPoints = await getTotalPoints(userId, levelId);
    const totalLessons = await models.learnAndEarnPrismicLesson.count({
        distinct: true,
        col: 'lessonId',
        where: {
            levelId
        }
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

export async function answer(user: { userId: number; address: string }, answers: number[], prismicId: string) {
    const t = await sequelize.transaction();
    try {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - config.intervalBetweenLessons);

        const [lessonRegistry] = await Promise.all([
            models.learnAndEarnPrismicLesson.findOne({
                attributes: ['lessonId', 'levelId'],
                where: {
                    prismicId
                }
            })
            // models.appUser.findOne({
            //     attributes: ['id', 'clientId'],
            //     where: {
            //         id: user.userId,
            //         // [Op.or]: [{ phoneValidated: true }, { emailValidated: true }]
            //     }
            // }),
            // getUserRoles(user.address)
        ]);
        // const [lessonRegistry, verifiedUser, userRoles] = await Promise.all([
        //     models.learnAndEarnPrismicLesson.findOne({
        //         attributes: ['lessonId', 'levelId'],
        //         where: {
        //             prismicId
        //         }
        //     }),
        //     models.appUser.findOne({
        //         attributes: ['id', 'clientId'],
        //         where: {
        //             id: user.userId,
        //             // [Op.or]: [{ phoneValidated: true }, { emailValidated: true }]
        //         }
        //     }),
        //     getUserRoles(user.address)
        // ]);

        if (!lessonRegistry) {
            throw new BaseError('LESSON_NOT_FOUND', 'lesson not found for the given id');
        }
        // const isValidUser = verifiedUser?.clientId === 2 || userRoles.beneficiary || userRoles.manager;
        // if (!isValidUser) {
        //     throw new BaseError(
        //         'USER_NOT_VALIDATED',
        //         'user phone number or email is not validated nor beneficiary/manager'
        //     );
        // }

        // check if already completed a lesson today
        const concludedLessons = await models.learnAndEarnUserLesson.count({
            where: {
                completionDate: {
                    [Op.gte]: daysAgo.setHours(0, 0, 0, 0)
                },
                userId: user.userId,
                levelId: lessonRegistry.levelId
            }
        });

        if (concludedLessons > 0) {
            throw new BaseError('LESSONS_COMPLETION_LIMIT', 'user has reached the limit of completed lessons');
        }

        const prismicLesson = await prismic.getByID(prismicId, {
            lang: '*'
        });

        if (!prismicLesson) {
            throw new BaseError('LESSON_NOT_FOUND', 'lesson not found for the given id');
        }

        const rightAnswers = prismicLesson.data.questions.map(question =>
            question.items.findIndex(item => item['is-correct'])
        );

        // get wrong answers
        const wrongAnswers = answers.reduce<number[]>((acc, el, index) => {
            if (rightAnswers[index] !== el) {
                acc.push(index);
            }
            return acc;
        }, []);

        if (wrongAnswers && wrongAnswers.length > 0) {
            // set attempts
            const userLesson = await models.learnAndEarnUserLesson.increment('attempts', {
                by: 1,
                where: {
                    userId: user.userId,
                    lessonId: lessonRegistry.lessonId,
                    levelId: lessonRegistry.levelId,
                    status: 'started'
                }
            });

            // return wrong answers
            await t.rollback();
            cleanLearnAndEarnCache(user.userId);
            return {
                success: false,
                wrongAnswers,
                attempts: userLesson[0][0][0].attempts
            };
        }

        // completed lesson, calculate points
        const userLesson = await models.learnAndEarnUserLesson.findOne({
            where: {
                lessonId: lessonRegistry.lessonId,
                levelId: lessonRegistry.levelId,
                userId: user.userId
            }
        });

        if (userLesson && userLesson.status === 'completed') {
            throw new BaseError('LESSON_ALREADY_COMPLETED', 'lesson already completed');
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
                completionDate: new Date()
            },
            {
                where: {
                    userId: user.userId,
                    lessonId: lessonRegistry.lessonId,
                    levelId: lessonRegistry.levelId
                },
                transaction: t
            }
        );

        const totalPoints = await getTotalPoints(user.userId, lessonRegistry.levelId);
        // verify if all the lessons was completed
        const availableLessons = await countAvailableLessons(lessonRegistry.levelId, user.userId);

        if (availableLessons === 0) {
            // verify if user comply with rules
            const level = await models.learnAndEarnLevel.findOne({
                attributes: ['rules', 'rewardLimit'],
                where: { id: lessonRegistry.levelId }
            });

            if (!level) {
                throw new BaseError('LEVEL_NOT_FOUND', 'level not found');
            }

            // validate if user has the required tokens
            if (level.rules?.tokens) {
                const provider = new ethers.providers.StaticJsonRpcProvider(config.chain.jsonRPCUrlCelo, {
                    name: 'Celo',
                    chainId: config.chain.isMainnet ? 42220 : 44787
                });
                for (const token of level.rules.tokens) {
                    const tokenContract = new ethers.Contract(token.address, contracts.ERC20ABI, provider);
                    const balance = new BigNumber((await tokenContract.balanceOf(user.address)).toString());
                    const amount = new BigNumber(token.amount).multipliedBy(new BigNumber(10).pow(18));
                    if (balance.lt(amount)) {
                        throw new BaseError('INSUFFICIENT_TOKENS', 'user has insufficient tokens');
                    }
                }
            }

            // if so, complete the level and make the payment
            await models.learnAndEarnUserLevel.update(
                {
                    status: 'completed',
                    completionDate: new Date()
                },
                {
                    where: {
                        userId: user.userId,
                        levelId: lessonRegistry.levelId
                    },
                    transaction: t
                }
            );

            // create signature
            const amount = await calculateReward(user.userId, lessonRegistry.levelId, points);
            const signature = await signParams(user.address, lessonRegistry.levelId, amount);

            // check available reward
            if (level.rewardLimit) {
                const payments = await models.learnAndEarnPayment.sum('amount', {
                    where: {
                        levelId: lessonRegistry.levelId
                    }
                });

                const reward = (payments || 0) + amount;

                if (level.rewardLimit >= reward) {
                    await savePayment(user.userId, lessonRegistry.levelId, amount, signature, t);
                }
            } else {
                await savePayment(user.userId, lessonRegistry.levelId, amount, signature, t);
            }

            await models.learnAndEarnUserData.increment(['lessons', 'levels'], {
                where: { userId: user.userId },
                transaction: t
            });
            await t.commit();
            cleanLearnAndEarnCache(user.userId);
            return {
                success: true,
                attempts,
                points,
                totalPoints: points + totalPoints,
                availableLessons,
                levelCompleted: lessonRegistry.levelId
            };
        }
        await models.learnAndEarnUserData.increment('lessons', { where: { userId: user.userId }, transaction: t });
        await t.commit();
        cleanLearnAndEarnCache(user.userId);
        return {
            success: true,
            attempts,
            points,
            totalPoints: points + totalPoints,
            availableLessons
        };
    } catch (error) {
        await t.rollback();
        throw new BaseError(error.name || 'VERIFY_ANSWER_FAILED', error.message || 'failed to verify answers');
    }
}

const savePayment = async (userId: number, levelId: number, amount: number, signature: string, t: Transaction) => {
    await models.learnAndEarnPayment.create(
        {
            userId,
            levelId,
            amount,
            status: 'pending',
            signature
        },
        { transaction: t }
    );
};
