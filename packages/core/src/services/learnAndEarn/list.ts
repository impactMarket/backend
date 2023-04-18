import { literal, Op, WhereOptions, fn, col } from 'sequelize';

import { models } from '../../database';
import { LearnAndEarnLesson } from '../../interfaces/learnAndEarn/learnAndEarnLesson';
import { LearnAndEarnLevel } from '../../interfaces/learnAndEarn/learnAndEarnLevel';
import { formatObjectToNumber } from '../../utils';
import { BaseError } from '../../utils/baseError';
import config from '../../config';

export async function listLevels(
    userId: number,
    offset: number,
    limit: number,
    status?: string,
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
        let whereCategory = {};
        if (category) {
            whereCategory = {
                where: {
                    prismicId: category,
                },
            };
        }

        const user = await models.appUser.findOne({
            attributes: ['language'],
            where: { id: userId },
        });
        const where: WhereOptions<LearnAndEarnLevel> = {
            [Op.and]: [
                // TODO: sanitize this
                status
                    ? literal(
                          status === 'available'
                              ? `("userLevel".status = 'started' or "userLevel".status is null)`
                              : `"userLevel".status = '${status}'`
                      )
                    : {},
                level ? { prismicId: level } : {},
                { languages: { [Op.contains]: [user!.language] } },
                { active: true },
                process.env.API_ENVIRONMENT === 'production'
                    ? { isLive: true }
                    : {},
            ],
        };
        const userLevels = (await models.learnAndEarnLevel.findAll({
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
                    where: {
                        active: true,
                    }
                },
                {
                    attributes: ['prismicId'],
                    model: models.learnAndEarnCategory,
                    as: 'category',
                    duplicating: false,
                    ...whereCategory,
                },
            ],
            where,
            group: [
                '"LearnAndEarnLevelModel".id',
                '"LearnAndEarnLevelModel".prismicId',
                '"LearnAndEarnLevelModel"."totalReward"',
                'category."prismicId',
                'category.id',
                '"userLevel".status',
            ],
            order: [literal('"category".id')],
            limit,
            offset,
            raw: true,
        })) as unknown as {
            id: number;
            prismicId: string;
            totalReward: number;
            status: string;
            totalLessons: number;
            category?: {
                prismicId: string;
            };
        }[];
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
                    ...whereCategory,
                },
            ],
            where,
        });
        return {
            count,
            rows: userLevels.map(
                ({
                    id,
                    prismicId,
                    totalReward,
                    totalLessons,
                    status,
                    category,
                }) =>
                    formatObjectToNumber({
                        id,
                        prismicId,
                        totalReward,
                        totalLessons,
                        status: status || 'available',
                        category: category?.prismicId,
                    })
            ),
        };
    } catch (error) {
        console.log({ error });
        throw new BaseError('LIST_LEVELS_FAILED', 'list levels failed');
    }
}

export async function listLessons(userId: number, levelId: number) {
    try {
        const user = await models.appUser.findOne({
            attributes: ['language'],
            where: { id: userId },
        });
        const lessons = await models.learnAndEarnLesson.findAll({
            include: [
                {
                    attributes: [
                        'status',
                        'points',
                        'attempts',
                        'completionDate',
                    ],
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
                languages: { [Op.contains]: [user!.language] },
                active: true,
                ...(process.env.API_ENVIRONMENT === 'production'
                    ? { isLive: true }
                    : {}),
            },
        });

        let totalPoints = 0;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - config.intervalBetweenLessons);
        const completedToday = await models.learnAndEarnUserLesson.count({
            where: {
                completionDate: {
                    [Op.gte]: daysAgo.setHours(0, 0, 0, 0),
                },
                userId,
            },
        });

        const mappedLessons = lessons.map(
            ({ id, prismicId, levelId, userLesson }: LearnAndEarnLesson) => {
                const { status, points, attempts, completionDate } =
                    userLesson!.length > 0
                        ? userLesson![0].toJSON()
                        : {
                              status: 'available',
                              points: 0,
                              attempts: 0,
                              completionDate: null,
                          };

                totalPoints += points || 0;
                return {
                    id,
                    prismicId,
                    levelId,
                    status,
                    points,
                    attempts,
                    completionDate,
                };
            }
        );

        const rewardAvailable = await getRewardAvailable(levelId);

        return {
            totalPoints,
            rewardAvailable,
            completedToday: completedToday > 0,
            lessons: mappedLessons,
        };
    } catch (error) {
        throw new BaseError('LIST_LESSONS_FAILED', 'list lessons failed');
    }
}

const getRewardAvailable = async (levelId: number): Promise<boolean> => {
    const level = await models.learnAndEarnLevel.findOne({
        attributes: ['rewardLimit', 'totalReward'],
        where: {
            id: levelId,
        }
    });

    if (!level?.rewardLimit) {
        return true;
    }

    const payments = await models.learnAndEarnPayment.sum('amount', {
        where: {
            levelId,
        }
    });

    if (!payments) {
        return true;
    }

    return (level.rewardLimit > (payments + level.totalReward));
};
