import { literal } from 'sequelize';

import { models } from '../../database';
import { BaseError } from '../../utils/baseError';

export default class LearnAndEarnService {
    public async total(userId: number) {
        try {
            // get levels
            const levels = await models.learnAndEarnLevel.findAll({
                attributes: [
                    [
                        literal(
                            `count(*) FILTER (WHERE "userLevel".status = 'complete')`
                        ),
                        'complete',
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
            });

            // get lessons
            const lessons = await models.learnAndEarnLesson.findAll({
                attributes: [
                    [
                        literal(
                            `count(*) FILTER (WHERE "userLesson".status = 'complete')`
                        ),
                        'complete',
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
            });

            // get earned
            const payments = await models.learnAndEarnPayment.findOne({
                attributes: [[literal(`sum(amount)`), 'amount']],
                where: {
                    userId,
                },
                raw: true,
            });

            return {
                lessons: lessons[0],
                levels: levels[0],
                received: payments?.amount || 0,
            };
        } catch (error) {
            throw new BaseError('GET_TOTAL_FAILED', 'get total failed');
        }
    }
}
