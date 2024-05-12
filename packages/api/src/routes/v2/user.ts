import { Router } from 'express';
import timeout from 'connect-timeout';

import { adminAuthentication, authenticateToken, verifySignature } from '~middlewares/index';
import {
    queryListUserNotificationsValidator,
    create as userCreate,
    readNotifications as userReadNotifications,
    report as userReport,
    sendPushNotifications as userSendPushNotifications,
    update as userUpdate
} from '~validators/user';
import UserController from '~controllers/v2/user';

export default (app: Router): void => {
    const route = Router();
    const userController = new UserController();

    app.use('/users', route);

    /**
     * @swagger
     *
     * /users:
     *   post:
     *     tags:
     *       - "users"
     *     summary: "Create user"
     *     parameters:
     *       - in: header
     *         name: client-id
     *         schema:
     *           type: integer
     *         required: false
     *         description: optional client id
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               address:
     *                 type: string
     *                 required: true
     *               phone:
     *                 type: string
     *                 description: phone number
     *                 required: false
     *               language:
     *                 type: string
     *                 required: false
     *               currency:
     *                 type: string
     *                 required: false
     *               walletPNT:
     *                 type: string
     *                 required: false
     *               appPNT:
     *                 type: string
     *                 required: false
     *               firstName:
     *                 type: string
     *                 required: false
     *               lastName:
     *                 type: string
     *                 required: false
     *               gender:
     *                 type: string
     *                 enum: [u, m, f, o]
     *                 required: false
     *               age:
     *                 type: number
     *                 required: false
     *               children:
     *                 type: number
     *                 required: false
     *               avatarMediaPath:
     *                 type: string
     *                 required: false
     *               email:
     *                 type: string
     *                 required: false
     *               bio:
     *                 type: string
     *                 required: false
     *               country:
     *                 type: string
     *                 required: false
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.post('/', userCreate, userController.create);

    /**
     * @swagger
     *
     * /users:
     *   get:
     *     tags:
     *       - "users"
     *     summary: "Get user"
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.get('/', authenticateToken, timeout('3s'), userController.get);

    /**
     * @swagger
     *
     * /users:
     *   put:
     *     tags:
     *       - "users"
     *     summary: "Update user"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               language:
     *                 type: string
     *                 required: false
     *               currency:
     *                 type: string
     *                 required: false
     *               walletPNT:
     *                 type: string
     *                 nullable: true
     *                 required: false
     *               appPNT:
     *                 type: string
     *                 nullable: true
     *                 required: false
     *               firstName:
     *                 type: string
     *                 required: false
     *               lastName:
     *                 type: string
     *                 required: false
     *               gender:
     *                 type: string
     *                 enum: [u, m, f, o]
     *                 required: false
     *               age:
     *                 type: number
     *                 nullable: true
     *                 required: false
     *               children:
     *                 type: number
     *                 nullable: true
     *                 required: false
     *               avatarMediaPath:
     *                 type: string
     *                 required: false
     *               email:
     *                 type: string
     *                 required: false
     *               bio:
     *                 type: string
     *                 required: false
     *               country:
     *                 type: string
     *                 required: false
     *               phone:
     *                 type: string
     *                 required: false
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.put('/', authenticateToken, verifySignature, userUpdate, userController.update);

    /**
     * @swagger
     *
     * /users:
     *   patch:
     *     tags:
     *       - "users"
     *     summary: "Patch changes user"
     *     description: "Patch changes user"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               action:
     *                 type: string
     *                 enum: [beneficiary-rules, manager-rules]
     *                 required: true
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.patch('/', authenticateToken, userController.patch);

    /**
     * @swagger
     *
     * /users:
     *   delete:
     *     tags:
     *       - "users"
     *     summary: "Delete user"
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.delete('/', authenticateToken, userController.delete);

    /**
     * @swagger
     *
     * /users/report:
     *   post:
     *     tags:
     *       - "users"
     *     summary: "Send anonymous report"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               communityId:
     *                 type: number
     *                 required: true
     *               category:
     *                 type: string
     *                 enum: [general, potential-fraud]
     *                 required: true
     *               message:
     *                 type: string
     *                 required: true
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.post('/report', authenticateToken, userReport, userController.report);

    /**
     * @swagger
     *
     * /users/report:
     *   get:
     *     tags:
     *       - "users"
     *     summary: "List anonymous report"
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for report pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for report pagination
     *       - in: query
     *         name: community
     *         schema:
     *           type: integer
     *         required: false
     *         description: community ID
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - BearerToken: []
     */
    route.get('/report/:query?', authenticateToken, timeout('3s'), userController.getReport);

    /**
     * @swagger
     *
     * /users/logs:
     *   get:
     *     tags:
     *       - "users"
     *     summary: Get user logs
     *     parameters:
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [edited_user, edited_community]
     *         required: true
     *         description: the log type
     *       - in: query
     *         name: entity
     *         schema:
     *           type: string
     *         required: true
     *         description: community ID or user address
     *     description: Enable ambassadors to see the change logs of communities and users they are responsible for
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.get('/logs', authenticateToken, timeout('3s'), userController.getLogs);

    /**
     * @swagger
     *
     * /users/presigned:
     *   get:
     *     tags:
     *       - "users"
     *     summary: "Get AWS presigned URL to upload media content"
     *     parameters:
     *       - in: query
     *         name: mime
     *         schema:
     *           type: string
     *         required: true
     *         description: media mimetype
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.get('/presigned/:query?', authenticateToken, timeout('3s'), userController.getPresignedUrlMedia);

    /**
     * @swagger
     *
     * /users/notifications:
     *   get:
     *     tags:
     *       - "users"
     *     summary: Get all notifications from a user
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for community pagination (default 0)
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for community pagination (default 10)
     *       - in: query
     *         name: isWebApp
     *         schema:
     *           type: boolean
     *         required: false
     *       - in: query
     *         name: isWallet
     *         schema:
     *           type: boolean
     *         required: false
     *       - in: query
     *         name: unreadOnly
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter by unread notifications only. If undefined, it will return all notifications
     *     responses:
     *       "200":
     *          description: OK
     *          content:
     *            application/json:
     *              schema:
     *                type: object
     *                properties:
     *                  success:
     *                    type: boolean
     *                  data:
     *                    $ref: '#/components/schemas/AppNotification'
     *     security:
     *     - BearerToken: []
     */
    route.get(
        '/notifications/:query?',
        authenticateToken,
        queryListUserNotificationsValidator,
        timeout('3s'),
        userController.getNotifications
    );

    /**
     * @swagger
     *
     * /users/notifications:
     *   put:
     *     tags:
     *       - "users"
     *     summary: Mark all notifications as read
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               notifications:
     *                 type: array
     *                 items:
     *                   type: integer
     *     responses:
     *       "200":
     *          description: OK
     *          content:
     *            application/json:
     *              schema:
     *                type: object
     *                properties:
     *                  success:
     *                    type: boolean
     *                  data:
     *                    type: boolean
     *                    description: if true the notification was updated
     *     security:
     *     - BearerToken: []
     */
    route.put('/notifications', authenticateToken, userReadNotifications, userController.readNotifications);

    /**
     * @swagger
     *
     * /users/{address}:
     *   get:
     *     tags:
     *       - "users"
     *     summary: "Get user by address using authorized account"
     *     parameters:
     *       - in: path
     *         name: address
     *         schema:
     *           type: string
     *         required: true
     *         description: user address
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.get('/:address', authenticateToken, timeout('3s'), userController.getUserFromAuthorizedAccount);

    route.post(
        '/push-notifications',
        adminAuthentication,
        userSendPushNotifications,
        userController.sendPushNotifications
    );

    route.post('/request-verify', authenticateToken, userController.requestVerify);
};
