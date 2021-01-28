import { Logger } from '@logger/logger';
import { celebrate, Joi } from 'celebrate';
import { Router, Request, Response } from 'express';

import { authenticateToken } from '../middlewares';
import UserService from '../services/user';

export default (app: Router): void => {
    const controllerLogAndFail = (e: any, status: number, res: Response) => {
        Logger.error(e);
        res.status(status).send(e);
    };

    const route = Router();

    app.use('/user', route);

    route.post(
        '/authenticate',
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                language: Joi.string().required(),
                currency: Joi.string().optional().allow(''),
                pushNotificationToken: Joi.string().required().allow(''),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, language, currency, pushNotificationToken } = req.body;
            UserService.authenticate(address, language, currency, pushNotificationToken)
                .then((user) => res.send(user))
                .catch((e) => res.sendStatus(403));
        }
    );

    route.get('/exists/:address', (req: Request, res: Response) => {
        UserService.exists(req.params.address)
            .then((u) => {
                if (u === false) {
                    res.sendStatus(404);
                } else {
                    res.send('OK');
                }
            })
            .catch((e) => controllerLogAndFail(e, 404, res));
    });

    route.post(
        '/hello',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                token: Joi.string().allow(''),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, token } = req.body;
            if (token.length > 0) {
                // failing to set the push notification, should not be a blocker!
                UserService.setPushNotificationsToken(
                    address,
                    token
                ).catch((e) =>
                    Logger.warn(`Error setting push notification token ` + e)
                );
            }
            UserService.hello(address)
                .then((u) => res.send(u))
                .catch((e) => controllerLogAndFail(e, 403, res));
        }
    );

    route.post(
        '/username',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                username: Joi.string().required().allow(''),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, username } = req.body;
            UserService.setUsername(address, username)
                .then(() => res.sendStatus(200))
                .catch((e) => controllerLogAndFail(e, 400, res));
        }
    );

    route.post(
        '/currency',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                currency: Joi.string().required(),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, currency } = req.body;
            UserService.setCurrency(address, currency)
                .then(() => res.sendStatus(200))
                .catch((e) => controllerLogAndFail(e, 400, res));
        }
    );

    route.post(
        '/push-notifications',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                token: Joi.string().required(),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, token } = req.body;
            UserService.setPushNotificationsToken(address, token)
                .then(() => res.sendStatus(200))
                .catch((e) => controllerLogAndFail(e, 400, res));
        }
    );

    route.post(
        '/language',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                language: Joi.string().required(),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, language } = req.body;
            UserService.setLanguage(address, language)
                .then(() => res.sendStatus(200))
                .catch((e) => controllerLogAndFail(e, 400, res));
        }
    );

    route.post(
        '/gender',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                gender: Joi.string().required().allow(''),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, gender } = req.body;
            UserService.setGender(address, gender)
                .then(() => res.sendStatus(200))
                .catch((e) => controllerLogAndFail(e, 400, res));
        }
    );

    route.post(
        '/age',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                age: Joi.number().required().allow(null),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, age } = req.body;
            UserService.setYear(address, new Date().getFullYear() - age)
                .then(() => res.sendStatus(200))
                .catch((e) => controllerLogAndFail(e, 400, res));
        }
    );

    route.post(
        '/children',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                children: Joi.number().required().allow(null),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, children } = req.body;
            UserService.setChildren(address, children)
                .then(() => res.sendStatus(200))
                .catch((e) => controllerLogAndFail(e, 400, res));
        }
    );

    /**
     * @deprecated Deprecated in mobile-app@0.1.0
     */
    route.post(
        '/auth',
        celebrate({
            body: Joi.object({
                authKey: Joi.string().optional(), // TODO: make required
                address: Joi.string().required(),
                language: Joi.string().required(),
                pushNotificationsToken: Joi.string().optional().allow(''), // TODO: make required
                pushNotificationToken: Joi.string().optional().allow(''), // TODO: make required
            }),
        }),
        async (req: Request, res: Response) => {
            let {
                address,
                language,
                pushNotificationsToken,
                pushNotificationToken,
            } = req.body;
            if (
                pushNotificationToken === null ||
                pushNotificationToken === undefined
            ) {
                if (
                    pushNotificationsToken === null ||
                    pushNotificationsToken === undefined
                ) {
                    pushNotificationToken = '';
                } else {
                    pushNotificationToken = pushNotificationsToken;
                }
            }
            try {
                const result = await UserService.auth(
                    address,
                    language,
                    pushNotificationToken
                );
                if (result === undefined) {
                    res.sendStatus(403);
                    return;
                }
                res.send(result);
            } catch (e) {
                Logger.error(e);
                res.sendStatus(403);
            }
        }
    );

    /**
     * @deprecated Deprecated in mobile-app@0.1.0
     */
    route.post(
        '/welcome',
        authenticateToken,
        celebrate({
            body: Joi.object({
                authKey: Joi.string().optional(), // TODO: remove
                address: Joi.string().required(),
                token: Joi.string().allow(''),
            }),
        }),
        async (req: Request, res: Response) => {
            const { address, token } = req.body;
            if (token.length > 0) {
                try {
                    await UserService.setPushNotificationsToken(address, token);
                } catch (e) {
                    Logger.warn(e);
                    res.sendStatus(403);
                }
            }
            try {
                res.send(await UserService.welcome(address));
            } catch (e) {
                Logger.warn(e);
                res.sendStatus(403);
            }
        }
    );

    /**
     * @deprecated Deprecated in mobile-app@0.1.5
     */
    route.post(
        '/childs',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                childs: Joi.number().required().allow('').allow(null),
            }),
        }),
        (req: Request, res: Response) => {
            const { address, childs } = req.body;
            UserService.setChildren(address, childs)
                .then(() => res.sendStatus(200))
                .catch((e) => controllerLogAndFail(e, 400, res));
        }
    );
};
