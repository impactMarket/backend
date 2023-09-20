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
    lessons: number;
    clients: number[];
    totalReward: number;
    rewardLimit?: number;
    asset?: string;
    adminUserId: number;
    status: ['pending', 'aproved', 'declined', 'published'];
    rules?: {
        countries?: string[];
        roles?: string[];
        limitUsers?: number;
    };
}

export interface LearnAndEarnLevelCreation {
    adminUserId: number;
    status?: string;
    rules?: {
        countries?: string[];
        roles?: string[];
        limitUsers?: number;
    };
}
