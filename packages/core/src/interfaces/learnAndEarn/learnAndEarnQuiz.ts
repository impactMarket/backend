/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnQuiz:
 *        type: object
 *        required:
 *          - id
 *          - order
 *          - active
 *          - lessonId
 *          - answerId
 *        properties:
 *          id:
 *            type: integer
 *          order:
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
    order: number;
    lessonId: number;
    answerId: string;
    active: boolean;
}

export interface LearnAndEarnQuizCreation {
    order: number;
    lessonId: number;
    answerId: string;
    active: boolean;
}
