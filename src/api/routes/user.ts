import {
    Router,
    Request,
    Response,
} from 'express';
import UserService from '../services/user';
import {
    celebrate,
    Joi
} from 'celebrate';
import { authenticateToken } from '../middlewares';
import { Logger } from '@logger/logger';


const route = Router();

export default (app: Router): void => {
    app.use('/user', route);

    //TODO: remove -  used until mobile-app@0.0.29
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
            if (pushNotificationToken === null || pushNotificationToken === undefined) {
                if (pushNotificationsToken === null || pushNotificationsToken === undefined) {
                    pushNotificationToken = '';
                } else {
                    pushNotificationToken = pushNotificationsToken;
                }
            }
            const result = await UserService.auth(
                address,
                language,
                pushNotificationToken,
            );
            if (result === undefined) {
                res.sendStatus(403);
                return;
            }
            res.send(result);
        },
    );

    //TODO: remove -  used until mobile-app@0.0.29
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
            const {
                address,
                token,
            } = req.body;
            if (token.length > 0) {
                try {
                    await UserService.setPushNotificationsToken(
                        address,
                        token
                    );
                } catch (e) {
                    Logger.warn(e);
                }
            }
            try {
                res.send(await UserService.welcome(address));
            } catch (e) {
                Logger.warn(e);
                res.sendStatus(403);
            }
        },
    );

    // used from mobile-app@0.1.0
    route.post(
        '/authenticate',
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                language: Joi.string().required(),
                pushNotificationToken: Joi.string().required().allow(''),
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                address,
                language,
                pushNotificationToken,
            } = req.body;
            const result = await UserService.authenticate(
                address,
                language,
                pushNotificationToken,
            );
            if (result === undefined) {
                res.sendStatus(403);
                return;
            }
            res.send(result);
        },
    );

    route.get(
        '/exists/:address',
        (req: Request, res: Response) => {
            UserService.exists(req.params.address).then((u) => {
                console.log('u', u);
                if (u === false) {
                    res.sendStatus(404);
                } else {
                    res.send('OK');
                }
            }).catch((e) => {
                console.log(e);
                res.sendStatus(404)
            });
        },
    );

    // used from mobile-app@0.1.0
    route.post(
        '/hello',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                token: Joi.string().allow(''),
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                address,
                token,
            } = req.body;
            if (token.length > 0) {
                try {
                    await UserService.setPushNotificationsToken(
                        address,
                        token
                    );
                } catch (e) {
                    Logger.warn(e);
                }
            }
            try {
                res.send(await UserService.hello(address));
            } catch (e) {
                Logger.warn(e);
                res.sendStatus(403);
            }
        },
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
        async (req: Request, res: Response) => {
            const {
                address,
                username,
            } = req.body;
            res.sendStatus(await UserService.setUsername(
                address,
                username
            ) ? 200 : 404);
        },
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
        async (req: Request, res: Response) => {
            const {
                address,
                currency,
            } = req.body;
            res.sendStatus(await UserService.setCurrency(
                address,
                currency
            ) ? 200 : 404);
        },
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
        async (req: Request, res: Response) => {
            const {
                address,
                token,
            } = req.body;
            res.sendStatus(await UserService.setPushNotificationsToken(
                address,
                token
            ) ? 200 : 404);
        },
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
        async (req: Request, res: Response) => {
            const {
                address,
                language,
            } = req.body;
            res.sendStatus(await UserService.setLanguage(
                address,
                language
            ) ? 200 : 404);
        },
    );

    route.post(
        '/gender',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                gender: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                address,
                gender,
            } = req.body;
            res.sendStatus(await UserService.setGender(
                address,
                gender
            ) ? 200 : 404);
        },
    );

    route.post(
        '/age',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                age: Joi.number().required(),
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                address,
                age,
            } = req.body;
            res.sendStatus(await UserService.setAge(
                address,
                age
            ) ? 200 : 404);
        },
    );

    route.post(
        '/childs',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                childs: Joi.number().required(),
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                address,
                childs,
            } = req.body;
            res.sendStatus(await UserService.setChilds(
                address,
                childs
            ) ? 200 : 404);
        },
    );
};