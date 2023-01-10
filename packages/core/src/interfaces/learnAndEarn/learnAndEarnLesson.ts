import { LearnAndEarnUserLessonModel } from '../../database/models/learnAndEarn/learnAndEarnUserLesson';

/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnLesson:
 *        type: object
 *        required:
 *          - id
 *          - prismicId
 *          - levelId
 *          - active
 *        properties:
 *          id:
 *            type: integer
 *          prismicId:
 *            type: string
 *          levelId:
 *            type: number
 *          language:
 *            type: string
 *          active:
 *            type: boolean
 */
export interface LearnAndEarnLesson {
    id: number;
    prismicId: string;
    levelId: number;
    languages?: string[];
    active: boolean;
    isLive?: boolean;

    // used on query with associations
    userLesson?: LearnAndEarnUserLessonModel[];
}

export interface LearnAndEarnLessonCreation {
    prismicId: string;
    levelId: number;
    languages?: string[];
    active: boolean;
    isLive?: boolean;
}
