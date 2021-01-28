import UserController from '@controllers/user';
import UserValidators from '@validators/user';
import { Router } from 'express';

import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();
    const userController = new UserController();

    app.use('/user', route);

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
