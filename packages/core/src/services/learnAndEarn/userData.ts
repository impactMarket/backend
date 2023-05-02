import { literal, Op } from 'sequelize';

import { models } from '../../database';
import { formatObjectToNumber } from '../../utils';
import { BaseError } from '../../utils/baseError';

export async function total(userId: number): Promise<{
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
}> {
    try {
        // get levels
        const user = await models.appUser.findOne({
            attributes: ['language'],
            where: { id: userId },
        });
        const levels = (await models.learnAndEarnPrismicLevel.findAll({
            attributes: [
                [
                    literal(
                        `count(*) FILTER (WHERE "userLevel".status = 'completed')`
                    ),
                    'completed',
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
                language: user!.language,
                ...(process.env.API_ENVIRONMENT === 'production'
                ? { isLive: true }
                : {})
            },
            raw: true,
        })) as unknown as {
            completed: string;
            total: string;
        }[];

        // get lessons
        const lessons = (await models.learnAndEarnPrismicLesson.findAll({
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
            group: [
                '"LearnAndEarnPrismicLessonModel".levelId',
                '"LearnAndEarnPrismicLessonModel".lessonId',
                '"LearnAndEarnPrismicLessonModel".language',
                '"userLesson".status'
            ],
            where: {
                language: user!.language,
                ...(process.env.API_ENVIRONMENT === 'production'
                    ? { isLive: true }
                    : {})
            },
            raw: true,
        })) as unknown as {
            completed: string;
            total: string;
        }[];

        // get earned
        const claimRewards = await models.learnAndEarnPayment.findAll({
            attributes: ['levelId', 'amount', 'signature'],
            where: {
                userId,
                status: 'pending',
            },
        });

        type Steps = { completed: number; total: number };
        const level = formatObjectToNumber<Steps>(levels[0]);
        const lesson = formatObjectToNumber<Steps>(lessons[0]);

        return {
            lesson,
            level,
            claimRewards: {
                ...claimRewards.map(({ levelId, amount, signature }) => ({
                    levelId,
                    amount,
                    signature,
                })),
            },
        };
    } catch (error) {
        throw new BaseError('GET_TOTAL_FAILED', 'get total failed');
    }
}
