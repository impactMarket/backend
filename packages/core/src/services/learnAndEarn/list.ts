import { literal, Op } from 'sequelize';

import { models } from '../../database';
import { BaseError } from '../../utils/baseError';

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
        const where: any = {
            [Op.and]: [
                status
                    ? literal(
                          status === 'available'
                              ? `("userLevel".status = 'started' or "userLevel".status is null)`
                              : `"userLevel".status = '${status}'`
                      )
                    : '',
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
                'category.id',
                '"userLevel".status',
            ],
            order: [literal('"category".id')],
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

export async function listLessons(userId: number, levelId: number) {
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
