import { Router } from 'express';

import UserController from '../../controllers/v2/user';
import { authenticateToken } from '../../middlewares';
import userValidators from '../../validators/user';

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
     *               pushNotificationToken:
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
     *               phone:
     *                 type: string
     *                 required: false
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.post('/', userValidators.create, userController.create);

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
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/', authenticateToken, userController.get);

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
     *               pushNotificationToken:
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
     *     - api_auth:
     *       - "write:modify":
     */
    route.put(
        '/',
        authenticateToken,
        userValidators.update,
        userController.update
    );

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
     *     - api_auth:
     *       - "write:modify":
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
     *     - api_auth:
     *       - "write:modify":
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
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/report',
        authenticateToken,
        userValidators.report,
        userController.report
    );

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
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/logs', authenticateToken, userController.getLogs);

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
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/presigned/:query?',
        authenticateToken,
        userController.getPresignedUrlMedia
    );

    /**
     * @swagger
     *
     * /users/notifications/unread:
     *   get:
     *     tags:
     *       - "users"
     *     summary: Get the number of unread notifications from a user
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
     *                    type: integer
     *                    description: number of unread notifications
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
     route.get(
        '/notifications/unread',
        authenticateToken,
        userController.getUnreadNotifications
    );

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
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/notifications/:query?',
        authenticateToken,
        userController.getNotifications
    );

    /**
     * @swagger
     *
     * /users/notifications/read:
     *   put:
     *     tags:
     *       - "users"
     *     summary: Mark all notifications as read
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
     *     - api_auth:
     *       - "write:modify":
     */
    route.put(
        '/notifications/read',
        authenticateToken,
        userController.readNotifications
    );

    /**
     * @swagger
     *
     * /users/{id-or-address}:
     *   get:
     *     tags:
     *       - "users"
     *     summary: "Get user by id or contract address"
     *     parameters:
     *       - in: path
     *         name: id-or-address
     *         schema:
     *           type: string
     *         required: true
     *         description: user id or address
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
     route.get('/:idOrAddress', authenticateToken, userController.findBy);
};
