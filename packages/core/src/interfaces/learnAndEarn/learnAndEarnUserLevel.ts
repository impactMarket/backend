/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnUserLevel:
 *        type: object
 *        required:
 *          - id
 *          - userId
 *          - levelId
 *          - status
 *          - completionDate
 *        properties:
 *          id:
 *            type: integer
 *          userId:
 *            type: number
 *          levelId:
 *            type: number
 *          status:
 *            type: string
 *          completionDate:
 *            type: date
 */
export interface LearnAndEarnUserLevel {
    id: number;
    userId: number;
    levelId: number;
    status: 'available' | 'started' | 'completed';
    completionDate: Date;
}

export interface LearnAndEarnUserLevelCreation {
    userId: number;
    levelId: number;
    status: 'available' | 'started' | 'completed';
    completionDate?: Date;
}
