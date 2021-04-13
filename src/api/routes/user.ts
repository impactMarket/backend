import UserController from '@controllers/user';
import userValidators from '@validators/user';
import { Router } from 'express';
import multer from 'multer';

import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();
    const userController = new UserController();
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

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
        userValidators.authenticate,
        userController.authenticate
    );

    route.post(
        '/report',
        authenticateToken,
        userValidators.report,
        userController.report
    );

    route.get('/exists/:address', userController.userExists);

    route.post(
        '/hello',
        authenticateToken,
        userValidators.hello,
        userController.hello
    );

    route.post(
        '/username',
        authenticateToken,
        userValidators.updateUsername,
        userController.updateUsername
    );

    route.post(
        '/currency',
        authenticateToken,
        userValidators.updateCurrency,
        userController.updateCurrency
    );

    route.post(
        '/push-notifications',
        authenticateToken,
        userValidators.updatePushNotificationsToken,
        userController.updatePushNotificationsToken
    );

    route.post(
        '/language',
        authenticateToken,
        userValidators.updateLanguage,
        userController.updateLanguage
    );

    route.post(
        '/gender',
        authenticateToken,
        userValidators.updateGender,
        userController.updateGender
    );

    route.post(
        '/age',
        authenticateToken,
        userValidators.updateAge,
        userController.updateAge
    );

    route.post(
        '/children',
        authenticateToken,
        userValidators.updateChildren,
        userController.updateChildren
    );

    route.post(
        '/picture',
        upload.single('imageFile'),
        authenticateToken,
        userController.pictureAdd
    );

    route.post(
        '/device',
        authenticateToken,
        userValidators.device,
        userController.device
    );
};
