/**
 * @swagger
 *  components:
 *    schemas:
 *      AppNotification:
 *        type: object
 *        required:
 *          - id
 *          - userId
 *          - type
 *          - params
 *          - read
 *          - createdAt
 *        properties:
 *          id:
 *            type: integer
 *            description: Notification id
 *          userId:
 *            type: string
 *            description: User ID
 *          type:
 *            type: integer
 *            description: Notification type
 *          params:
 *            type: string
 *            description: Params to some action
 *          read:
 *            type: boolean
 *            description: If the notification is read
 *          createdAt:
 *            type: string
 *            description: Date of creation
 */

export enum NotificationType {
    STORY_LIKED,
    BENEFICIARY_ADDED,
    MANAGER_ADDED,
    COMMUNITY_CREATED,
}

export interface AppNotification {
    id: number;
    userId: number;
    type: number;
    params: object;
    read: boolean;

    //timestamp
    createdAt: Date;
}

export interface AppNotificationCreation {
    userId: number;
    type: number;
    params?: object;
    read?: boolean;
}
