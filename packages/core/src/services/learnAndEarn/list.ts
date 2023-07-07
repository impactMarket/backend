import { Includeable, Op, ProjectionAlias, WhereOptions, literal } from 'sequelize';

import { BaseError } from '../../utils/baseError';
import { LearnAndEarnPrismicLesson } from '../../interfaces/learnAndEarn/learnAndEarnPrismicLesson';
import { LearnAndEarnPrismicLevel } from '../../interfaces/learnAndEarn/learnAndEarnPrismicLevel';
import { formatObjectToNumber } from '../../utils';
import { getUserRoles } from '../../subgraph/queries/user';
import { models } from '../../database';
import config from '../../config';

export async function listLevels(
    offset: number,
    limit: number,
    userId?: number,
    status?: string,
    level?: string,
    language?: string
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
        const userQuery: {
            attributes: ProjectionAlias[];
            include: Includeable[];
            group: string[];
        } = {
            attributes: [],
            include: [],
            group: []
        };
        const levelQuery: {
            include: Includeable[];
            group: string[];
        } = {
            include: [],
            group: []
        };

        if (userId) {
            const user = await models.appUser.findOne({
                attributes: ['address', 'language', 'country'],
                where: { id: userId }
            });
            const userRole = await getUserRoles(user!.address);
            const roles = Object.keys(userRole).filter(key => userRole[key as keyof typeof userRole]);

            levelQuery.group = ['level.rules'];
            levelQuery.include = [
                {
                    attributes: ['rules'],
                    model: models.learnAndEarnLevel,
                    as: 'level',
                    where: {
                        rules: {
                            countries: {
                                ...(user?.country
                                    ? {
                                          [Op.or]: [{ [Op.is]: null }, { [Op.iLike]: `%${user.country}%` }]
                                      }
                                    : {
                                          [Op.is]: null
                                      })
                            },
                            roles: {
                                [Op.or]: [
                                    { [Op.is]: null },
                                    ...roles.map(role => ({
                                        [Op.iLike]: `%${role}%`
                                    }))
                                ]
                            }
                        }
                    },
                    duplicating: false
                }
            ];

            language = user?.language;
            userQuery.include.push({
                attributes: [],
                model: models.learnAndEarnUserLevel,
                as: 'userLevel',
                required: false,
                where: {
                    userId
                },
                duplicating: false
            });
            userQuery.attributes.push([literal('"userLevel".status'), 'status']);
            userQuery.group.push('"userLevel".status');
        }

        if (!language) {
            throw new BaseError('LANGUAGE_NOT_FOUND', 'language not found');
        }

        const where: WhereOptions<LearnAndEarnPrismicLevel> = {
            [Op.and]: [
                status
                    ? status === 'available'
                        ? {
                              [Op.or]: [{ '$userLevel.status$': 'started' }, { '$userLevel.status$': null }]
                          }
                        : { '$userLevel.status$': status }
                    : {},
                level ? { prismicId: level } : {},
                { language },
                process.env.API_ENVIRONMENT === 'production' ? { isLive: true } : {}
            ]
        };

        const userLevels = (await models.learnAndEarnPrismicLevel.findAll({
            attributes: [
                'levelId',
                'prismicId',
                [literal(`count(lesson.id)`), 'totalLessons'],
                ...userQuery.attributes
            ],
            include: [
                ...userQuery.include,
                ...levelQuery.include,
                {
                    attributes: [],
                    model: models.learnAndEarnPrismicLesson,
                    as: 'lesson',
                    required: false,
                    duplicating: false,
                    where: {
                        ...(process.env.API_ENVIRONMENT === 'production' ? { isLive: true } : {}),
                        language
                    }
                }
            ],
            where,
            group: [
                '"learnAndEarnPrismicLevel".id',
                '"learnAndEarnPrismicLevel".prismicId',
                ...userQuery.group,
                ...levelQuery.group
            ],
            limit,
            offset,
            raw: true
        })) as unknown as {
            levelId: number;
            prismicId: string;
            status: string;
            totalLessons: number;
            rules?: {
                limitUsers: number;
                countries: string[];
                roles: string[];
            };
        }[];
        const count = await models.learnAndEarnPrismicLevel.count({
            attributes: [],
            include: [...userQuery.include, ...levelQuery.include],
            where
        });

        // get levels where limitUser is bellow the total of users that started the level X days ago
        const startedUsers = await models.learnAndEarnLevel.findAll({
            attributes: ['id'],
            include: [
                {
                    attributes: [],
                    model: models.learnAndEarnUserLevel,
                    as: 'userLevel',
                    where: {
                        [Op.or]: [
                            {
                                status: 'started',
                                createdAt: {
                                    [Op.gte]: new Date(new Date().getDate() - config.daysToLimitUsers)
                                }
                            },
                            {
                                status: 'completed'
                            }
                        ]
                    }
                }
            ],
            group: ['"learnAndEarnLevel".id'],
            having: literal(`count("userLevel"."id") >= ("learnAndEarnLevel"."rules"#>>'{limitUsers}')::int`),
            raw: true
        });

        // filter levels
        const filteredUserLevels = userLevels.filter(userLevel => {
            const startedUser = startedUsers.find(startedUser => startedUser.id === userLevel.levelId);
            return !startedUser;
        });

        return {
            count: count - startedUsers.length,
            rows: filteredUserLevels.map(({ prismicId, totalLessons, status }) =>
                formatObjectToNumber({
                    prismicId,
                    totalLessons,
                    status: status || 'available'
                })
            )
        };
    } catch (error) {
        console.log({ error });
        throw new BaseError(error.name || 'LIST_LEVELS_FAILED', error.message || 'list levels failed');
    }
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
