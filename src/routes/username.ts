import { Router, Request, Response, NextFunction } from 'express';
import UsernameService from '../services/username';
import { celebrate, Joi } from 'celebrate';

const route = Router();


export default (app: Router) => {
    app.use('/username', route);

    route.get(
        '/:address',
        async (req: Request, res: Response, next: NextFunction) => {
            res.send(await UsernameService.get(req.params.address));
        },
    );

    route.post(
        '/',
        celebrate({
            body: Joi.object({
                address: Joi.string().required(),
                username: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const {
                address,
                username,
            } = req.body;
            await UsernameService.set(
                address,
                username
            );
            res.sendStatus(200);
        },
    );
};