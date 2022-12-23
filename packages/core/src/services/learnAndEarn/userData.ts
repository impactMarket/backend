import { literal } from 'sequelize';

import { models } from '../../database';
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
        const levels = (await models.learnAndEarnLevel.findAll({
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
        const claimRewards = await models.learnAndEarnPayment.findAll({
            attributes: ['levelId', 'amount', 'signature'],
            where: {
                userId,
                status: 'pending',
            },
        });

        return {
            lesson: {
                completed: parseInt(lessons[0].completed, 10),
                total: parseInt(lessons[0].total, 10),
            },
            level: {
                completed: parseInt(levels[0].completed, 10),
                total: parseInt(levels[0].total, 10),
            },
            claimRewards: {
                ...claimRewards.map((e) => ({
                    levelId: e.levelId,
                    amount: e.amount,
                    signature: e.signature,
                })),
            },
        };
    } catch (error) {
        throw new BaseError('GET_TOTAL_FAILED', 'get total failed');
    }
}
