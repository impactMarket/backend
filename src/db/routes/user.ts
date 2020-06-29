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
        '/username',
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
            await UserService.setUsername(
                address,
                username
            );
            res.sendStatus(200);
        },
    );

    route.post(
        '/currency',
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
            await UserService.setCurrency(
                address,
                currency
            );
            res.sendStatus(200);
        },
    );
};