/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnUserLesson:
 *        type: object
 *        required:
 *          - id
 *          - userId
 *          - lessonId
 *          - status
 *          - completionDate
 *          - attempts
 *          - points
 *        properties:
 *          id:
 *            type: integer
 *          userId:
 *            type: integer
 *          lessonId:
 *            type: integer
 *          status:
 *            type: string
 *          completionDate:
 *            type: date
 *          attempts:
 *            type: integer
 *          points:
 *            type: integer
 */
export interface LearnAndEarnUserLesson {
    id: number;
    userId: number;
    lessonId: number;
    status: 'available' | 'started' | 'completed';
    completionDate: Date;
    attempts: number;
    points: number;
}

export interface LearnAndEarnUserLessonCreation {
    userId: number;
    lessonId: number;
    status: 'available' | 'started' | 'completed';
    completionDate?: Date;
    attempts?: number;
    points?: number;
}
