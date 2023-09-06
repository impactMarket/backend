import { BaseError } from '../../utils/baseError';
import { cleanLearnAndEarnCache } from '../../utils/cache';
import { models, sequelize } from '../../database';

export async function startLesson(userId: number, prismicId: string) {
    try {
        const status = 'started';
        const lesson = await models.learnAndEarnPrismicLesson.findOne({
            attributes: ['levelId', 'lessonId'],
            where: {
                prismicId
            }
        });

        if (!lesson) {
            throw new BaseError('START_LESSON_FAILED', 'failed to start a lesson');
        }

        const { lessonId, levelId } = lesson;

        const [[userLesson], [userLevel]] = await sequelize.transaction(async t => {
            return await Promise.all([
                models.learnAndEarnUserLesson.findOrCreate({
                    where: {
                        lessonId,
                        levelId,
                        userId
                    },
                    transaction: t,
                    defaults: {
                        lessonId,
                        levelId,
                        userId,
                        points: 0,
                        attempts: 0,
                        status
                    }
                }),
                models.learnAndEarnUserLevel.findOrCreate({
                    where: {
                        levelId,
                        userId
                    },
                    transaction: t,
                    defaults: {
                        levelId,
                        userId,
                        status
                    }
                }),
                cleanLearnAndEarnCache(userId)
            ]);
        });

        return {
            lesson: userLesson.toJSON(),
            level: userLevel.toJSON()
        };
    } catch (error) {
        throw new BaseError(error.name || 'START_LESSON_FAILED', error.message || 'failed to start a lesson');
    }
}
