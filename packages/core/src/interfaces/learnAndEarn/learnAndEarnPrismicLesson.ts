/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnPrismicLesson:
 *        type: object
 *        required:
 *          - id
 *          - prismicId
 *          - referenceCode
 *          - language
 *        properties:
 *          id:
 *            type: integer
 *          prismicId:
 *            type: string
 *          referenceCode:
 *            type: number
 *          language:
 *            type: string
 */
export interface LearnAndEarnPrismicLesson {
    id: number;
    prismicId: string;
    referenceCode: number;
    language: string;
}

export interface LearnAndEarnPrismicLessonCreation {
    prismicId: string;
    referenceCode: number;
    language: string;
}
