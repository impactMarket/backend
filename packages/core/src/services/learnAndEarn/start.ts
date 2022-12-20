import { models } from '../../database';
import { BaseError } from '../../utils/baseError';

export async function startLesson(userId: number, lessonId: number) {
    try {
        const status = 'started';
        const lesson = await models.learnAndEarnLesson.findOne({
            attributes: ['levelId'],
            where: {
                id: lessonId,
            },
        });
        const level = await models.learnAndEarnLevel.findOne({
            attributes: ['id', 'categoryId'],
            where: {
                id: lesson!.levelId,
            },
        });

        // create userLesson
        const userLesson = await models.learnAndEarnUserLesson.findOrCreate({
            where: {
                lessonId,
                userId,
            },
            defaults: {
                lessonId,
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

        const userCategory = await models.learnAndEarnUserCategory.findOrCreate(
            {
                where: {
                    categoryId: level!.categoryId,
                    userId,
                },
                defaults: {
                    categoryId: level!.categoryId,
                    userId,
                    status,
                },
            }
        );

        return {
            lesson: userLesson[0].toJSON(),
            level: userLevel[0].toJSON(),
            category: userCategory[0].toJSON(),
        };
    } catch (error) {
        throw new BaseError(
            error.name || 'START_LESSON_FAILED',
            error.message || 'failed to start a lesson'
        );
    }
}
