/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiClaimLocation:
 *        type: object
 *        required:
 *          - id
 *          - communityId
 *          - gps
 *          - createdAt
 *        properties:
 *          id:
 *            type: integer
 *          communityId:
 *            type: string
 *          gps:
 *            type: object
 *            properties:
 *              latitude:
 *                type: integer
 *              longitude:
 *                type: integer
 *          createdAt:
 *            type: string
 */

export interface UbiClaimLocation {
    id: number;
    communityId: string;
    gps: {
        latitude: number;
        longitude: number;
    };

    // timestamps
    createdAt: Date;
}
export interface UbiClaimLocationCreation {
    communityId: number;
    gps: {
        latitude: number;
        longitude: number;
    };
}
