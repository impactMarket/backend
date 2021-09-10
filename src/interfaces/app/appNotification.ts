/**
 * @swagger
 *  components:
 *    schemas:
 *      AppNotification:
 *        type: object
 *        required:
 *          - id
 *          - address
 *          - type
 *          - params
 *          - read
 *          - createdAt
 *        properties:
 *          id:
 *            type: integer
 *            description: Notification id
 *          address:
 *            type: string
 *            description: User address
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

export interface AppNotification {
    id: number;
    address: string;
    type: number;
    params: {
        [key: string]: any;
    };
    read: boolean;

    //timestamp
    createdAt: Date;
    updatedAt: Date;
}

export interface AppNotificationCreation {
    address: string;
    type: number;
    params?: {
        [key: string]: any;
    };
    read?: boolean;
}
