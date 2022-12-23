/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnCategory:
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
 *          languages:
 *            type: string
 *          active:
 *            type: boolean
 */
export interface LearnAndEarnCategory {
    id: number;
    prismicId: string;
    languages?: string[];
    active: boolean;
}

export interface LearnAndEarnCategoryCreation {
    prismicId: string;
    languages?: string[];
    active: boolean;
}
