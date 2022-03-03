import { Router } from 'express';

import UserController from '../controllers/user';
import { authenticateToken } from '../middlewares';
import userValidators from '../validators/user';

export default (app: Router): void => {
    const route = Router();
    const userController = new UserController();

    app.use('/user', route);

    /**
     * @deprecated
     */
    route.post(
        '/authenticate',
        userValidators.auth,
        userController.authenticate
    );

    /**
     * @deprecated
     */
    route.post(
        '/hello',
        authenticateToken,
        userValidators.welcome,
        userController.hello
    );

    /**
     * @deprecated
     */
    route.get('/exists/:address', userController.userExists);

    /**
     * @swagger
     *
     * /user/auth:
     *   post:
     *     tags:
     *     - "user"
     *     summary: "Authenticate user"
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
     *                 description: phone number (hashed once it reaches the backend)
     *                 required: true
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
     *               avatarMediaId:
     *                 type: number
     *                 required: false
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.post('/auth', userValidators.auth, userController.auth);

    route.get(
        '/media/:mime',
        authenticateToken,
        userController.getPresignedUrlMedia
    );

    route.put('/avatar', authenticateToken, userController.updateAvatar);

    route.post(
        '/welcome',
        authenticateToken,
        userValidators.welcome,
        userController.welcome
    );

    route.post(
        '/report',
        authenticateToken,
        userValidators.reportv1,
        userController.report
    );

    route.get('/exist/:address', userController.userExist);

    /**
     * @deprecated Last used in 1.1.12
     */
    route.post(
        '/username',
        authenticateToken,
        userValidators.updateUsername,
        userController.updateUsername
    );

    /**
     * @deprecated Last used in 1.1.12
     */
    route.post(
        '/currency',
        authenticateToken,
        userValidators.updateCurrency,
        userController.updateCurrency
    );

    /**
     * @deprecated Last used in 1.1.12
     */
    route.post(
        '/push-notifications',
        authenticateToken,
        userValidators.updatePushNotificationsToken,
        userController.updatePushNotificationsToken
    );

    /**
     * @deprecated Last used in 1.1.12
     */
    route.post(
        '/language',
        authenticateToken,
        userValidators.updateLanguage,
        userController.updateLanguage
    );

    /**
     * @deprecated Last used in 1.1.12
     */
    route.post(
        '/gender',
        authenticateToken,
        userValidators.updateGender,
        userController.updateGender
    );

    /**
     * @deprecated Last used in 1.1.12
     */
    route.post(
        '/age',
        authenticateToken,
        userValidators.updateAge,
        userController.updateAge
    );

    /**
     * @deprecated Last used in 1.1.12
     */
    route.post(
        '/children',
        authenticateToken,
        userValidators.updateChildren,
        userController.updateChildren
    );

    route.post(
        '/device',
        authenticateToken,
        userValidators.device,
        userController.device
    );

    /**
     * @swagger
     *
     * /user:
     *   put:
     *     tags:
     *       - "user"
     *     summary: Edit existing user
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
     *               avatarMediaId:
     *                 type: number
     *                 required: false
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
     *                  user:
     *                    $ref: '#/components/schemas/AppUser'
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.put('/', authenticateToken, userValidators.edit, userController.edit);

    /**
     * @swagger
     *
     * /user/notifications/unread:
     *   get:
     *     tags:
     *       - "user"
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
     * /user/notifications:
     *   get:
     *     tags:
     *       - "user"
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
     * /user/notifications/read:
     *   put:
     *     tags:
     *       - "user"
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
     * /user/newsletter:
     *   post:
     *     tags:
     *       - "user"
     *     summary: Subscribe or Unsubscribe newsletter
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               subscribe:
     *                 type: boolean
     *                 required: true
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
     *                    description: If success
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/newsletter',
        authenticateToken,
        userValidators.subscribeNewsletter,
        userController.subscribeNewsletter
    );

    /**
     * @swagger
     *
     * /user/newsletter:
     *   get:
     *     tags:
     *       - "user"
     *     summary: Verify newsletter subscription
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *              schema:
     *                type: object
     *                properties:
     *                  success:
     *                    type: boolean
     *                  data:
     *                    type: boolean
     *                    description: Is the user subscribed to the newsletter?
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/newsletter',
        authenticateToken,
        userController.verifyNewsletterSubscription
    );

    /**
     * @swagger
     *
     * /user:
     *   delete:
     *     tags:
     *       - "user"
     *     summary: Delete a user
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.delete('/', authenticateToken, userController.delete);

    /**
     * @swagger
     *
     * /user/read-rules/{endpoint}:
     *   put:
     *     tags:
     *       - "user"
     *     summary: Read beneficiary/manager rules
     *     parameters:
     *       - in: path
     *         name: endpoint
     *         schema:
     *           type: string
     *           enum: [beneficiary, manager]
     *         required: false
     *         description: read rules of a beneficiary or manager
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: boolean
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.put(
        '/read-rules/(|beneficiary|manager)',
        authenticateToken,
        userController.readRules
    );

    /**
     * @swagger
     *
     * /user/survey:
     *   post:
     *     tags:
     *       - "user"
     *     summary: Save the answers of the survey
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: array
     *             items:
     *               type: object
     *               properties:
     *                 surveyId:
     *                   type: number
     *                   required: true
     *                 question:
     *                   type: number
     *                   required: true
     *                   description: The question identifier
     *                 answer:
     *                   type: string
     *                   required: true
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
     *                    type: array
     *                    items:
     *                      $ref: '#/components/schemas/UbiBeneficiarySurvey'
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/survey',
        authenticateToken,
        userValidators.saveSurvey,
        userController.saveSurvey
    );

    /**
     * @swagger
     *
     * /community/logs:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get user logs
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
     route.get('/logs', authenticateToken, userController.getLogs);
};
