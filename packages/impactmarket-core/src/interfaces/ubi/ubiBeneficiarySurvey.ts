/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiBeneficiarySurvey:
 *        type: object
 *        required:
 *          - id
 *          - userId
 *          - question
 *          - answer
 *          - createdAt
 *        properties:
 *          id:
 *            type: integer
 *            description: Notification id
 *          userId:
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
    userId: number;
    surveyId: number;
    question: number;
    answer: string;

    //timestamp
    createdAt: Date;
}

export interface UbiBeneficiarySurveyCreation {
    userId?: number;
    surveyId: number;
    question: number;
    answer: string;
}
