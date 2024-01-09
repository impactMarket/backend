import { Op, literal } from 'sequelize';

import { BaseError } from '../../utils/baseError';
import { models, redisClient } from '../../database';

async function countAllLevelsAndLessons(clientId: number, language: string) {
    const cacheResults = await redisClient.get(`countAllLevelsAndLessons/${clientId}`);

    if (cacheResults) {
        return JSON.parse(cacheResults);
    }

    const res = await models.learnAndEarnPrismicLevel.findOne({
        attributes: [
            [literal(`count("learnAndEarnPrismicLevel".id)`), 'levels'],
            [literal(`sum(level.lessons)`), 'lessons']
        ],
        include: [
            {
                attributes: [],
                model: models.learnAndEarnLevel,
                as: 'level'
            }
        ],
        where: {
            [Op.and]: [
                clientId ? { '$level.clients$': { [Op.contains]: [clientId] } } : {},
                { language },
                process.env.API_ENVIRONMENT === 'production' ? { isLive: true } : {}
            ]
        },
        // this raw: true is needed, otherwise, the query will include id's,
        // which include groups and that doesn't make any sense
        raw: true
    });
    const globalStats = res as unknown as { levels: string; lessons: string };

    const result = {
        levels: parseInt(globalStats.levels, 10),
        lessons: parseInt(globalStats.lessons, 10)
    };

    // this is deleted when there's an update
    await redisClient.set(`countAllLevelsAndLessons/${clientId}`, JSON.stringify(result), 'EX', 60 * 60 * 6);

    return result;
}

export async function total(
    userId: number,
    clientId: number,
    language?: string
): Promise<{
    lesson: {
        completed: number;
        total: number;
    };
    level: {
        completed: number;
        total: number;
    };
    claimRewards: {
        levelId: number;
        amount: number;
        signature: string;
    }[];
    rewards: { token: string; amount: number }[];
}> {
    try {
        if (!language) {
            const user = await models.appUser.findOne({
                attributes: ['language'],
                where: { id: userId }
            });

            if (!user) {
                throw new BaseError('USER_NOT_FOUND', 'user not found');
            }

            language = user.language;
        }

        // first requested is cached here, the others are cached on the endpoint
        // it is cleared when the user submits a correct answer, changing this values
        const [allData, userData, claimRewards, payments] = await Promise.all([
            countAllLevelsAndLessons(clientId, language),
            models.learnAndEarnUserData.findOne({
                attributes: ['levels', 'lessons'],
                where: { userId }
            }),
            models.learnAndEarnPayment.findAll({
                attributes: ['levelId', 'amount', 'signature'],
                where: {
                    userId,
                    status: 'pending'
                }
            }),
            models.learnAndEarnPayment.findAll({
                attributes: ['amount'],
                include: [
                    {
                        model: models.learnAndEarnLevel,
                        attributes: ['asset'],
                        as: 'level'
                    }
                ],
                where: {
                    userId
                }
            })
        ]);

        return {
            lesson: {
                completed: userData?.lessons || 0,
                total: allData.lessons
            },
            level: {
                completed: userData?.levels || 0,
                total: allData.levels
            },
            claimRewards: claimRewards.map(({ levelId, amount, signature }) => ({
                levelId,
                amount,
                signature
            })),
            rewards: payments.map(payment => ({
                token: payment.level!.asset,
                amount: payment.amount
            }))
        };
    } catch (error) {
        console.log(error);
        throw new BaseError('GET_TOTAL_FAILED', 'get total failed');
    }
}

/**
 * Recalculate completed levels and lessons for a user. This is useful when changing language.
 * @param userId user id to update
 */
export async function recalculate(userId: number, language: string) {
    const [levels, lessons] = (await Promise.all([
        models.learnAndEarnPrismicLevel.findAll({
            attributes: [[literal(`count(*) FILTER (WHERE "userLevel".status = 'completed')`), 'completed']],
            include: [
                {
                    attributes: [],
                    model: models.learnAndEarnUserLevel,
                    as: 'userLevel',
                    where: {
                        userId
                    },
                    required: false
                }
            ],
            where: {
                language,
                ...(process.env.API_ENVIRONMENT === 'production' ? { isLive: true } : {})
            },
            raw: true
        }),
        models.learnAndEarnPrismicLesson.findAll({
            attributes: [[literal(`count(*) FILTER (WHERE "userLesson".status = 'completed')`), 'completed']],
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
                language,
                ...(process.env.API_ENVIRONMENT === 'production' ? { isLive: true } : {})
            },
            raw: true
        })
    ])) as [unknown, unknown] as [{ completed: string }[], { completed: string }[]];

    await models.learnAndEarnUserData.update(
        {
            levels: parseInt(levels[0].completed, 10),
            lessons: parseInt(lessons[0].completed, 10)
        },
        {
            where: { userId }
        }
    );
}
