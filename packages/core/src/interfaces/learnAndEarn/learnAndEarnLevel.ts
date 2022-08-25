/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnLevel:
 *        type: object
 *        required:
 *          - id
 *          - prismicId
 *          - active
 *        properties:
 *          id:
 *            type: integer
 *          prismicId:
 *            type: string
 *          categoryId:
 *            type: number
 *          active:
 *            type: boolean
 */
export interface LearnAndEarnLevel {
    id: number;
    prismicId: string;
    categoryId: number;
    active: boolean;
}

export interface LearnAndEarnLevelCreation {
    prismicId: string;
    categoryId: number;
    active: boolean;
}
