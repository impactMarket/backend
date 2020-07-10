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
import { Sequelize } from 'sequelize/types';
import ExpressBrute from 'express-brute';
import SequelizeStore from 'express-brute-sequelize';


const route = Router();
let bruteforce: any;

export default (app: Router, sequelize: Sequelize): void => {
    app.use('/user', route);

    new SequelizeStore(sequelize, 'bruteStore', {}, (store: any) => {
        bruteforce = new ExpressBrute(store);
        route.post(
            '/auth',
            bruteforce.prevent, // error 403 if too many requests for this route in short time
            celebrate({
                body: Joi.object({
                    address: Joi.string().required(),
                    pin: Joi.string().required(),
                }),
            }),
            async (req: Request, res: Response) => {
                const {
                    address,
                    pin,
                } = req.body;
                const result = await UserService.auth(
                    address,
                    pin
                );
                if (result === undefined) {
                    res.sendStatus(403);
                    return;
                }
                res.send(result);
            },
        );
    });

    route.get(
        '/:address',
        async (req: Request, res: Response) => {
            res.send(await UserService.get(req.params.address));
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