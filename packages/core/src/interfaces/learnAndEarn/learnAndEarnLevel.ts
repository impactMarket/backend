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
 *          languages:
 *            type: string
 *          active:
 *            type: boolean
 */
export interface LearnAndEarnLevel {
    id: number;
    prismicId: string;
    categoryId: number;
    languages?: string[];
    active: boolean;
    isLive?: boolean;
    totalReward: number;
}

export interface LearnAndEarnLevelCreation {
    prismicId: string;
    categoryId: number;
    languages?: string[];
    active: boolean;
    isLive?: boolean;
    totalReward: number;
}
