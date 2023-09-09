import { Includeable, Op, WhereOptions, literal } from 'sequelize';

import { BaseError } from '../../utils/baseError';
import { LearnAndEarnPrismicLesson } from '../../interfaces/learnAndEarn/learnAndEarnPrismicLesson';
import { LearnAndEarnPrismicLevel } from '../../interfaces/learnAndEarn/learnAndEarnPrismicLevel';
import { models } from '../../database';
import config from '../../config';

const { learnAndEarnLevel, learnAndEarnPrismicLevel } = models;

export async function listLevels(
    _offset: number,
    _limit: number,
    status: 'available' | 'started' | 'completed',
    language: string,
    client: number,
    userId?: number
): Promise<{
    count: number;
    rows: {
        id: number;
        prismicId: string;
        totalReward: number;
        totalLessons: number;
    }[];
}> {
    const include: Includeable[] = [];
    let where: WhereOptions<LearnAndEarnPrismicLevel> | undefined;

    include.push({
        attributes: ['id', 'totalReward', 'lessons'],
        model: learnAndEarnLevel,
        where: {
            [Op.and]: [
                literal(
                    `(CAST("level"."rules"#>>\'{limitUsers}\' AS INTEGER) < (SELECT COUNT(*) FROM learn_and_earn_user_level AS ule WHERE ule."levelId" = level.id AND ((ule.status = \'started\' AND ule."createdAt" < '${new Date(
                        new Date().getTime() - 24 * 60 * 60 * 1000 * config.daysToLimitUsers
                    ).toISOString()}') OR ule.status = \'completed\')) OR "level"."rules" IS NULL)`
                ),
                client ? { client: { [Op.contains]: [client] } } : {}
            ]
        },
        as: 'level',
        required: true // INNER JOIN
    });

    if (userId) {
        include.push({
            attributes: [],
            model: models.learnAndEarnUserLevel,
            as: 'userLevel',
            required: false,
            where: {
                userId
            },
            duplicating: false
        });
        where = {
            [Op.and]: [
                status === 'available'
                    ? {
                          [Op.or]: [{ '$userLevel.status$': 'started' }, { '$userLevel.status$': null }]
                      }
                    : { '$userLevel.status$': status },
                { language },
                process.env.API_ENVIRONMENT === 'production' ? { isLive: true } : {}
            ]
        };
    }

    const levels = await learnAndEarnPrismicLevel.findAndCountAll({
        attributes: ['prismicId'],
        include,
        where: where || {
            [Op.and]: [{ language }, process.env.API_ENVIRONMENT === 'production' ? { isLive: true } : {}]
        }
    });

    return {
        count: levels.count,
        rows: levels.rows.map(({ prismicId, level }) => ({
            id: level!.id,
            prismicId,
            totalReward: level!.totalReward,
            totalLessons: level!.lessons
        }))
    };
}

export async function listLevelsByAdmin(userId: number) {
    try {
        const levels = await models.learnAndEarnLevel.findAll({
            attributes: ['id', 'title', 'status'],
            where: {
                adminUserId: userId
            }
        });
        return levels;
    } catch (error) {
        console.log({ error });
        throw new BaseError('LIST_LEVELS_FAILED', 'list levels failed');
    }
}

export async function listLessons(levelId: number | string, userId?: number, language?: string) {
    try {
        const include: Includeable[] = [];

        if (userId) {
            const user = await models.appUser.findOne({
                attributes: ['language'],
                where: { id: userId }
            });

            if (user?.language) {
                language = user.language;
            }

            include.push({
                attributes: ['status', 'points', 'attempts', 'completionDate'],
                model: models.learnAndEarnUserLesson,
                as: 'userLesson',
                required: false,
                where: {
                    userId
                }
            });
        }

        if (!language) {
            throw new BaseError('LANGUAGE_NOT_FOUND', 'language not found');
        }

        if (typeof levelId === 'string') {
            const level = await models.learnAndEarnPrismicLevel.findOne({
                attributes: ['levelId'],
                where: {
                    prismicId: levelId
                }
            });

            if (!level) {
                throw new BaseError('LEVEL_NOT_FOUND', 'level not found');
            }
            levelId = level.levelId;
        }

        const lessons = await models.learnAndEarnPrismicLesson.findAll({
            include,
            where: {
                levelId,
                language,
                ...(process.env.API_ENVIRONMENT === 'production' ? { isLive: true } : {})
            }
        });

        let totalPoints = 0;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - config.intervalBetweenLessons);
        const completedToday = await models.learnAndEarnUserLesson.count({
            where: {
                completionDate: {
                    [Op.gte]: daysAgo.setHours(0, 0, 0, 0)
                },
                userId,
                levelId
            }
        });

        const mappedLessons = lessons.map(({ prismicId, levelId, userLesson }: LearnAndEarnPrismicLesson) => {
            const { status, points, attempts, completionDate } =
                !!userLesson && userLesson.length > 0
                    ? userLesson![0].toJSON()
                    : {
                          status: 'available',
                          points: 0,
                          attempts: 0,
                          completionDate: null
                      };

            totalPoints += points || 0;
            return {
                prismicId,
                levelId,
                status,
                points,
                attempts,
                completionDate
            };
        });
        const rewardAvailable = await getRewardAvailable(levelId);

        return {
            totalPoints,
            rewardAvailable,
            completedToday: completedToday > 0,
            lessons: mappedLessons
        };
    } catch (error) {
        throw new BaseError(error.name || 'LIST_LESSONS_FAILED', error.message || 'list lessons failed');
    }
}

const getRewardAvailable = async (levelId: number): Promise<boolean> => {
    const level = await models.learnAndEarnLevel.findOne({
        attributes: ['rewardLimit', 'totalReward'],
        where: {
            id: levelId
        }
    });

    if (!level?.rewardLimit) {
        return true;
    }

    const payments = await models.learnAndEarnPayment.sum('amount', {
        where: {
            levelId
        }
    });

    if (!payments) {
        return true;
    }

    return level.rewardLimit > payments + level.totalReward;
};
