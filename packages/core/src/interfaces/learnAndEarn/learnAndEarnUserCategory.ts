/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnUserCategory:
 *        type: object
 *        required:
 *          - id
 *          - userId
 *          - categoryId
 *          - status
 *          - completionDate
 *        properties:
 *          id:
 *            type: integer
 *          userId:
 *            type: number
 *          categoryId:
 *            type: number
 *          status:
 *            type: string
 *          completionDate:
 *            type: date
 */
export interface LearnAndEarnUserCategory {
    id: number;
    userId: number;
    categoryId: number;
    status: 'available' | 'started' | 'completed';
    completionDate: Date;
}

export interface LearnAndEarnUserCategoryCreation {
    userId: number;
    categoryId: number;
    status: 'available' | 'started' | 'completed';
    completionDate?: Date;
}
