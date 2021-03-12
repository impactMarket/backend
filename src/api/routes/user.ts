import UserController from '@controllers/user';
import UserValidators from '@validators/user';
import { Router } from 'express';

import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();
    const userController = new UserController();

    app.use('/user', route);

    /**
     * @swagger
     *
     * /user/authenticate:
     *   post:
     *     tags:
     *     - "user"
     *     summary: "Authenticate user"
     *     requestBody:
     *       description: Optional description in *Markdown*
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: "object"
     *             properties:
     *               address:
     *                 type: "string"
     *               language:
     *                 type: "string"
     *               currency:
     *                 type: "string"
     *               pushNotificationToken:
     *                 type: "string"
     *             example:
     *               address: "0x8770b4Df915cb92F53Bc01cC9Ab15F51e5DBb52f"
     *               language: "pt"
     *               pushNotificationToken: ""
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.post(
        '/authenticate',
        UserValidators.authenticate,
        userController.authenticate
    );

    route.get('/exists/:address', userController.userExists);

    route.post(
        '/hello',
        authenticateToken,
        UserValidators.hello,
        userController.hello
    );

    route.post(
        '/username',
        authenticateToken,
        UserValidators.updateUsername,
        userController.updateUsername
    );

    route.post(
        '/currency',
        authenticateToken,
        UserValidators.updateCurrency,
        userController.updateCurrency
    );

    route.post(
        '/push-notifications',
        authenticateToken,
        UserValidators.updatePushNotificationsToken,
        userController.updatePushNotificationsToken
    );

    route.post(
        '/language',
        authenticateToken,
        UserValidators.updateLanguage,
        userController.updateLanguage
    );

    route.post(
        '/gender',
        authenticateToken,
        UserValidators.updateGender,
        userController.updateGender
    );

    route.post(
        '/age',
        authenticateToken,
        UserValidators.updateAge,
        userController.updateAge
    );

    route.post(
        '/children',
        authenticateToken,
        UserValidators.updateChildren,
        userController.updateChildren
    );
};
