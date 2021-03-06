import UserController from '@controllers/user';
import userValidators from '@validators/user';
import { Router } from 'express';

import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();
    const userController = new UserController();

    app.use('/user', route);

    route.post(
        '/authenticate',
        userValidators.authenticate,
        userController.authenticate
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
        '/device',
        authenticateToken,
        userValidators.device,
        userController.device
    );
};
