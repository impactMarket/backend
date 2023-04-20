/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnPrismicLevel:
 *        type: object
 *        required:
 *          - id
 *          - prismicId
 *          - levelId
 *         - language
 *        properties:
 *          id:
 *            type: integer
 *          prismicId:
 *            type: string
 *          levelId:
 *            type: number
 *          language:
 *            type: string
 */
export interface LearnAndEarnPrismicLevel {
    id: number;
    prismicId: string;
    levelId: number;
    language: string;
}

export interface LearnAndEarnPrismicLevelCreation {
    prismicId: string;
    levelId: number;
    language: string;
}
