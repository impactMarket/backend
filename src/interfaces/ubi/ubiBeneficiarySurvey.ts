/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiBeneficiarySurvey:
 *        type: object
 *        required:
 *          - id
 *          - user
 *          - question
 *          - answer
 *          - createdAt
 *        properties:
 *          id:
 *            type: integer
 *            description: Notification id
 *          user:
 *            type: integer
 *            description: User ID
 *          question:
 *            type: integer
 *            description: Question ID
 *          answer:
 *            type: string
 *            description: Answer for the question
 *          createdAt:
 *            type: string
 *            description: Date of creation
 */

export interface UbiBeneficiarySurvey {
    id: number;
    user: number;
    question: number;
    answer: string;

    //timestamp
    createdAt: Date;
}

export interface UbiBeneficiarySurveyCreation {
    user?: number;
    question: number;
    answer: string;
}
