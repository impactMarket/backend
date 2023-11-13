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
    STORY_LIKED = 0,
    BENEFICIARY_ADDED = 1,
    MANAGER_ADDED = 2,
    COMMUNITY_CREATED = 3,
    // LOAN_ADDED = 4, // removed
    LEARN_AND_EARN_DO_NEW_LESSON = 5,
    // LOAN_STATUS_CHANGED = 6, // removed
    LOAN_APPLICATION_SUBMITTED = 7,
    LOAN_APPLICATION_RECEIVED = 8,
    LOAN_APPLICATION_APPROVED = 9,
    LOAN_APPLICATION_REJECTED = 10,
    LOAN_APPLICATION_REQUEST_CHANGES = 11,
    LOAN_APPLICATION_INTERVIEW = 12,
    TRANSACTION_RECEIVED = 13,
    MICROCREDIT_WELCOME = 14,
    REMINDER_LOAN_INTEREST = 15,
    LOAN_UNPAID = 16,
    LOW_PERFORMANCE = 17,
    HIGH_PERFORMANCE = 18,
    LEARN_AND_EARN_FINISH_LEVEL = 19,
    LEARN_AND_EARN_NEW_LEVEL = 20,
    SAVING_GROUP_INVITE = 21
}

export type NotificationParams = {
    path?: string;
};

export enum NotificationParamsPath {
    STORY = 'stories?id=',
    COMMUNITY = 'communities/',
    LOAN_APPLICATION = 'microcredit/form/',
    LOAN_APPROVED = 'microcredit/',
    LEARN_AND_EARN = 'learn-and-earn/'
}

export interface AppNotification {
    id: number;
    userId: number;
    type: number;
    params: object;
    read: boolean;
    isWallet: boolean;
    isWebApp: boolean;

    // timestamp
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
