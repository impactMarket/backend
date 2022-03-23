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
     * /user:
     *   post:
     *     tags:
     *     - "user"
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
     *               username:
     *                 type: string
     *                 required: false
     *               gender:
     *                 type: string
     *                 enum: [u, m, f, o]
     *                 required: false
     *               year:
     *                 type: number
     *                 required: false
     *               children:
     *                 type: number
     *                 required: false
     *               avatarMediaPath:
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
     * /user:
     *   get:
     *     tags:
     *     - "user"
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
     * /user:
     *   put:
     *     tags:
     *     - "user"
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
     *               username:
     *                 type: string
     *                 nullable: true
     *                 required: false
     *               gender:
     *                 type: string
     *                 enum: [u, m, f, o]
     *                 required: false
     *               year:
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
     * /user:
     *   patch:
     *     tags:
     *     - "user"
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
     *                 enum: [beneficiary-rules]
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
     * /user:
     *   delete:
     *     tags:
     *     - "user"
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
     * /user/report:
     *   post:
     *     tags:
     *     - "user"
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
     * /user/logs:
     *   get:
     *     tags:
     *       - "user"
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
     * /user/presigned/{mime}:
     *   get:
     *     tags:
     *     - "user"
     *     summary: "Get AWS presigned URL to upload media content"
     *     parameters:
     *       - in: path
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
        '/presigned/:mime',
        authenticateToken,
        userController.getPresignedUrlMedia
    );
};
