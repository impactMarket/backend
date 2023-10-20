/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnLevel:
 *        type: object
 *        required:
 *          - id
 *          - lessons
 *          - clients
 *          - totalReward
 *          - asset
 *          - adminUserId
 *          - status
 *        properties:
 *          id:
 *            type: integer
 *          lessons:
 *            type: integer
 *          clients:
 *            type: array
 *          totalReward:
 *            type: integer
 *          rewardLimit:
 *            type: integer
 *          asset:
 *            type: string
 *          adminUserId:
 *            type: integer
 *          status:
 *            type: string
 *          rules:
 *            type: object
 *            properties:
 *              countries:
 *                type: array
 *              roles:
 *                type: array
 *          limitUsers:
 *            type: integer
 */
export interface LearnAndEarnLevel {
    id: number;
    lessons: number;
    clients: number[];
    totalReward: number;
    rewardLimit?: number;
    asset: string;
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
