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
 *          - answer
 *        properties:
 *          id:
 *            type: integer
 *          order:
 *            type: string
 *          lessonId:
 *            type: number
 *          answer:
 *            type: number
 *          active:
 *            type: boolean
 */
export interface LearnAndEarnQuiz {
    id: number;
    order: number;
    lessonId: number;
    answer: number;
    active: boolean;
}

export interface LearnAndEarnQuizCreation {
    order: number;
    lessonId: number;
    answer: number;
    active: boolean;
}
