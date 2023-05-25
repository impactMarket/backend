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
    LOAN_ADDED,
    LEARN_AND_EARN_DO_NEW_LESSON
}

export interface AppNotification {
    id: number;
    userId: number;
    type: number;
    params: object;
    read: boolean;
    isWallet: boolean;
    isWebApp: boolean;

    //timestamp
    createdAt: Date;
}

export interface AppNotificationCreation {
    userId: number;
    type: number;
    params?: object;
    read?: boolean;
    isWallet?: boolean;
    isWebApp?: boolean;
}
