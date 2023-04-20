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
    title: string;
    prismicId: string;
    categoryId: number;
    languages?: string[];
    active: boolean;
    isLive?: boolean;
    totalReward: number;
    rewardLimit?: number;
    asset?: string;
    adminUserId: number;
    status: [
        'pending',
        'aproved',
        'declined',
        'published'
    ];
}

export interface LearnAndEarnLevelCreation {
    title: string;
    adminUserId: number;
    status?: string;
}
