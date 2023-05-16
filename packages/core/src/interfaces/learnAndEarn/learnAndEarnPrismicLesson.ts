import { LearnAndEarnUserLessonModel } from '../../database/models/learnAndEarn/learnAndEarnUserLesson';

/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnPrismicLesson:
 *        type: object
 *        required:
 *          - id
 *          - prismicId
 *          - lessonId
 *          - levelId
 *          - language
 *        properties:
 *          id:
 *            type: integer
 *          prismicId:
 *            type: string
 *          lessonId:
 *            type: number
 *          language:
 *            type: string
 *          isLive:
 *            type: boolean
 */
export interface LearnAndEarnPrismicLesson {
    id: number;
    prismicId: string;
    levelId: number;
    lessonId: number;
    language: string;
    isLive: boolean;

    userLesson?: LearnAndEarnUserLessonModel[];
}

export interface LearnAndEarnPrismicLessonCreation {
    prismicId: string;
    levelId: number;
    lessonId: number;
    language: string;
    isLive?: boolean;
}
