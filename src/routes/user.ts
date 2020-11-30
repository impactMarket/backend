import { celebrate, Joi } from 'celebrate';
import { Router, Request, Response } from 'express';

import { Logger } from '../loaders/logger';
import { authenticateToken } from '../middlewares';
import UserService from '../services/user';

const route = Router();

export default (app: Router): void => {
    app.use('/user', route);

    route.post(
        '/auth',
        celebrate({
            body: Joi.object({
                authKey: Joi.string().optional(), // TODO: make required
                address: Joi.string().required(),
                language: Joi.string().required(),
                pushNotificationToken: Joi.string().allow(''),
            }),
        }),
        async (req: Request, res: Response) => {
            let { address, language, pushNotificationToken } = req.body;
            if (
                pushNotificationToken === null ||
                pushNotificationToken === undefined
            ) {
                pushNotificationToken = '';
            }
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
        }
    );

    route.get('/:address', async (req: Request, res: Response) => {
        res.send(await UserService.get(req.params.address));
    });

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
                    Logger.warning(e);
                }
            }
            try {
                res.send(await UserService.welcome(address));
            } catch (e) {
                Logger.warning(e);
                res.sendStatus(403);
            }
        }
    );

    route.post(
        '/username',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(), // TODO: make it optional
                username: Joi.string().required().allow(''),
            }),
        }),
        async (req: Request, res: Response) => {
            const { address, username } = req.body;
            res.sendStatus(
                (await UserService.setUsername(address, username)) ? 200 : 404
            );
        }
    );

    route.post(
        '/currency',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(), // TODO: make it optional
                currency: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response) => {
            const { address, currency } = req.body;
            res.sendStatus(
                (await UserService.setCurrency(address, currency)) ? 200 : 404
            );
        }
    );

    route.post(
        '/push-notifications',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(), // TODO: make it optional
                token: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response) => {
            const { address, token } = req.body;
            res.sendStatus(
                (await UserService.setPushNotificationsToken(address, token))
                    ? 200
                    : 404
            );
        }
    );

    route.post(
        '/language',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(), // TODO: make it optional
                language: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response) => {
            const { address, language } = req.body;
            res.sendStatus(
                (await UserService.setLanguage(address, language)) ? 200 : 404
            );
        }
    );
};
