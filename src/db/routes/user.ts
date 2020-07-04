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
import { authenticateToken } from '../../middlewares';

const route = Router();


export default (app: Router): void => {
    app.use('/user', route);

    route.get(
        '/:address',
        async (req: Request, res: Response) => {
            res.send(await UserService.get(req.params.address));
        },
    );

    route.post(
        '/auth',
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                signature: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                address,
                signature,
            } = req.body;
            const result = await UserService.auth(
                address,
                signature
            );
            if (result === undefined) {
                res.sendStatus(403);
                return;
            }
            res.send(result);
        },
    );

    route.post(
        '/username',
        authenticateToken,
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                username: Joi.string().required(),
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
};