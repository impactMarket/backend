import { models } from '../../database';
import { BaseError } from '../../utils/baseError';

export async function startLesson(userId: number, prismicId: string) {
    try {
        const status = 'started';
        const lesson = await models.learnAndEarnPrismicLesson.findOne({
            attributes: ['levelId', 'lessonId'],
            where: {
                prismicId,
            },
        });

        // create userLesson
        const userLesson = await models.learnAndEarnUserLesson.findOrCreate({
            where: {
                lessonId: lesson!.lessonId,
                levelId: lesson!.levelId,
                userId,
            },
            defaults: {
                lessonId: lesson!.lessonId,
                levelId: lesson!.levelId,
                userId,
                points: 0,
                attempts: 0,
                status,
            },
        });

        const userLevel = await models.learnAndEarnUserLevel.findOrCreate({
            where: {
                levelId: lesson!.levelId,
                userId,
            },
            defaults: {
                levelId: lesson!.levelId,
                userId,
                status,
            },
        });

        return {
            lesson: userLesson[0].toJSON(),
            level: userLevel[0].toJSON(),
        };
    } catch (error) {
        throw new BaseError(
            error.name || 'START_LESSON_FAILED',
            error.message || 'failed to start a lesson'
        );
    }
}
