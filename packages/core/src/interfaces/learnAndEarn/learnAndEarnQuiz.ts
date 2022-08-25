/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnQuiz:
 *        type: object
 *        required:
 *          - id
 *          - prismicId
 *          - active
 *          - lessonId
 *          - answerId
 *        properties:
 *          id:
 *            type: integer
 *          prismicId:
 *            type: string
 *          lessonId:
 *            type: number
 *          answerId:
 *            type: string
 *          active:
 *            type: boolean
 */
export interface LearnAndEarnQuiz {
    id: number;
    prismicId: string;
    lessonId: number;
    answerId: string;
    active: boolean;
}

export interface LearnAndEarnQuizCreation {
    prismicId: string;
    lessonId: number;
    answerId: string;
    active: boolean;
}
